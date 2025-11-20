import express from "express";
import type { Express, Request, Response } from "express";
import {
  horariosQuerySchema,
  novoAgendamentoSchema,
} from "./validation";
import { supabase } from "./supabase";

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
  const hora = Math.floor(minutos / 60).toString().padStart(2, "0");
  const minuto = (minutos % 60).toString().padStart(2, "0");
  return `${hora}:${minuto}`;
};

/**
 * CORREÇÃO AQUI ❗
 * Agora o dia da semana segue padrão:
 * Segunda = 1 ... Sábado = 6 (igual sua tabela)
 */
export async function carregarConfigAgenda(
  barbeiroId: string,
  data: string,
): Promise<AgendaConfig> {

  const diaJS = new Date(data).getDay(); // 0 = domingo
  const diaDaSemana = diaJS === 0 ? 7 : diaJS; // domingo vira 7, segunda=1, terça=2 ...

  const { data: config, error } = await supabase
    .from("agenda_config")
    .select("abre, fecha, duracao")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaDaSemana)
    .maybeSingle();

  if (error || !config) {
    throw new Error(
      `Nenhuma configuração encontrada para barbeiro ${barbeiroId} em ${data} (dia ${diaDaSemana})`
    );
  }

  return config;
}

export async function carregarAgendamentosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Agendamento[]> {

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("id, inicio, fim, data")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error || !agendamentos) {
    throw new Error(
      `Erro ao buscar agendamentos do barbeiro ${barbeiroId} no dia ${data}`
    );
  }

  return agendamentos;
}

export async function carregarBloqueiosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Bloqueio[]> {

  const { data: bloqueios, error } = await supabase
    .from("bloqueios")
    .select("id, inicio, fim, data")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error || !bloqueios) {
    throw new Error(
      `Erro ao buscar bloqueios do barbeiro ${barbeiroId} no dia ${data}`
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

  return horarios.filter((h) => !horariosIndisponiveis.has(h));
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

  return horarios.filter((h) => !horariosBloqueados.has(h));
}

export async function inserirAgendamento(agendamento: NovoAgendamento) {
  const { data, error } = await supabase
    .from("agendamentos")
    .insert(agendamento)
    .select("id, cliente, telefone, servico, data, hora, barbeiro_id")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível criar o agendamento.");
  }

  return data;
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
      const [config, agendamentos, bloqueios] = await Promise.all([
        carregarConfigAgenda(barbeiro_id, data),
        carregarAgendamentosDoDia(data, barbeiro_id),
        carregarBloqueiosDoDia(data, barbeiro_id),
      ]);

      const horariosBase = gerarHorariosPossiveis(config);

      const horariosLivres = removerHorariosBloqueados(
        removerHorariosOcupados(horariosBase, agendamentos, config.duracao),
        bloqueios,
        config.duracao,
      );

      res.json({ horarios: horariosLivres });
    } catch (erro) {
      console.error("Erro ao carregar horários", { erro });
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

    try {
      const agendamentoCriado = await inserirAgendamento(parsed.data);

      res.status(201).json({
        status: "confirmado",
        agendamento: agendamentoCriado,
      });

    } catch (erro) {
      console.error("Erro ao criar agendamento", { erro });
      res.status(500).json({ mensagem: "Não foi possível criar o agendamento." });
    }
  });
}

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
