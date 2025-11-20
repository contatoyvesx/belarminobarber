import express from "express";
import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import {
  barbeiroIdSchema,
  dataSchema,
  horaSchema,
  horariosQuerySchema,
  novoAgendamentoSchema,
} from "./validation";

export interface AgendaConfig {
  abre: string;
  fecha: string;
  duracao: number;
}

export interface Agendamento {
  id: string;
  inicio: string;
  fim: string;
  data: string;
}

export interface Bloqueio {
  id: string;
  inicio: string;
  fim: string;
  data: string;
}

export interface NovoAgendamento {
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  hora: string;
  barbeiro_id: string;
}

const minutosDoHorario = (horario: string): number => {
  const [hora, minuto] = horario.split(":").map(Number);
  return hora * 60 + minuto;
};

const horarioEmMinutos = (minutos: number): string => {
  const hora = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const minuto = (minutos % 60).toString().padStart(2, "0");
  return `${hora}:${minuto}`;
};

export async function carregarConfigAgenda(
  barbeiroId: string,
  data: string,
): Promise<AgendaConfig> {
  const { supabase } = await import("./supabase");
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay() || 7;

  const { data: config, error } = await supabase
    .from("agenda_config")
    .select("abre, fecha, duracao")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaDaSemana)
    .maybeSingle();

  if (error || !config) {
    throw new Error(`Barbeiro ${barbeiroId} sem configuração para o dia ${data}`);
  }

  return config;
}

export async function carregarAgendamentosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Agendamento[]> {
  const { supabase } = await import("./supabase");

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error || !agendamentos) {
    throw new Error(
      `Não foi possível carregar agendamentos para barbeiro ${barbeiroId} na data ${data}`,
    );
  }

  return agendamentos;
}

export async function carregarBloqueiosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Bloqueio[]> {
  const { supabase } = await import("./supabase");

  const { data: bloqueios, error } = await supabase
    .from("bloqueios")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error || !bloqueios) {
    throw new Error(
      `Não foi possível carregar bloqueios para barbeiro ${barbeiroId} na data ${data}`,
    );
  }

  return bloqueios;
}

export function gerarHorariosPossiveis(config: AgendaConfig): string[] {
  const horarios: string[] = [];
  const inicio = minutosDoHorario(config.abre);
  const fim = minutosDoHorario(config.fecha);

  for (let atual = inicio; atual + config.duracao <= fim; atual += config.duracao) {
    horarios.push(horarioEmMinutos(atual));
  }

  return horarios;
}

export function removerHorariosOcupados(
  horarios: string[],
  agendamentos: Agendamento[],
  passoMinutos: number,
): string[] {
  const horariosIndisponiveis = new Set(
    agendamentos.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const intervalos: string[] = [];

      for (let minuto = inicioMin; minuto < fimMin; minuto += passoMinutos) {
        intervalos.push(horarioEmMinutos(minuto));
      }

      return intervalos;
    }),
  );

  return horarios.filter((horario) => !horariosIndisponiveis.has(horario));
}

export function removerHorariosBloqueados(
  horarios: string[],
  bloqueios: Bloqueio[],
  passoMinutos: number,
): string[] {
  const horariosBloqueados = new Set(
    bloqueios.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const intervalos: string[] = [];

      for (let minuto = inicioMin; minuto < fimMin; minuto += passoMinutos) {
        intervalos.push(horarioEmMinutos(minuto));
      }

      return intervalos;
    }),
  );

  return horarios.filter((horario) => !horariosBloqueados.has(horario));
}

export async function inserirAgendamento(agendamento: NovoAgendamento) {
  const { data, hora, cliente, telefone, servico, barbeiro_id } = agendamento;

  return {
    id: randomUUID(),
    data,
    hora,
    cliente,
    telefone,
    servico,
    barbeiro_id,
  };
}

export function horariosRoute(app: Express) {
  app.get("/horarios", async (req: Request, res: Response) => {
    const parsed = horariosQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ mensagem: "Parâmetros de consulta inválidos." });
      return;
    }

    const { data, barbeiro_id } = parsed.data;

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const agendamentos = await carregarAgendamentosDoDia(data, barbeiro_id);
      const bloqueios = await carregarBloqueiosDoDia(data, barbeiro_id);

      const horariosBase = gerarHorariosPossiveis(config);
      const horariosLivres = removerHorariosBloqueados(
        removerHorariosOcupados(horariosBase, agendamentos, config.duracao),
        bloqueios,
        config.duracao,
      );

      res.json({ horarios: horariosLivres });
    } catch (error) {
      console.error("Erro ao carregar horários", {
        barbeiro_id,
        data,
        erro: error,
      });
      res.status(500).json({ mensagem: "Não foi possível carregar os horários." });
    }
  });
}

export function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/agendar", async (req: Request, res: Response) => {
    const parsed = novoAgendamentoSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({ mensagem: "Dados inválidos para agendar." });
      return;
    }

    const { data, hora, barbeiro_id } = parsed.data;

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const agendamentos = await carregarAgendamentosDoDia(data, barbeiro_id);
      const bloqueios = await carregarBloqueiosDoDia(data, barbeiro_id);

      const horariosLivres = removerHorariosBloqueados(
        removerHorariosOcupados(gerarHorariosPossiveis(config), agendamentos, config.duracao),
        bloqueios,
        config.duracao,
      );

      if (!horariosLivres.includes(hora)) {
        res.status(409).json({ mensagem: "Horário indisponível." });
        return;
      }

      const agendamentoCriado = await inserirAgendamento(parsed.data);

      res.status(201).json({ status: "confirmado", agendamento: agendamentoCriado });
    } catch (error) {
      console.error("Erro ao criar agendamento", {
        barbeiro_id,
        data,
        hora,
        erro: error,
      });
      res.status(500).json({ mensagem: "Não foi possível criar o agendamento." });
    }
  });
}

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
