import express from "express";
import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";

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

const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
  });

const horaSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .refine((value) => {
    const [hora, minuto] = value.split(":").map(Number);
    return Number.isInteger(hora) && Number.isInteger(minuto) && hora >= 0 && hora < 24 && minuto >= 0 && minuto < 60;
  });

export async function carregarConfigAgenda(
  barbeiroId: string,
  data: string,
): Promise<AgendaConfig> {
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay();
  const configsPorDia: Record<number, AgendaConfig> = {
    0: { abre: "10:00", fecha: "14:00", duracao: 30 },
    1: { abre: "09:00", fecha: "18:00", duracao: 30 },
    2: { abre: "09:00", fecha: "18:00", duracao: 30 },
    3: { abre: "09:00", fecha: "18:00", duracao: 30 },
    4: { abre: "09:00", fecha: "18:00", duracao: 30 },
    5: { abre: "09:00", fecha: "17:00", duracao: 30 },
    6: { abre: "10:00", fecha: "16:00", duracao: 30 },
  };

  const config = configsPorDia[diaDaSemana];

  if (!config) {
    throw new Error(`Barbeiro ${barbeiroId} sem configuração para o dia ${data}`);
  }

  return config;
}

export async function carregarAgendamentosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Agendamento[]> {
  return [
    {
      id: `${barbeiroId}-manhã`,
      inicio: "11:00",
      fim: "11:30",
      data,
    },
    {
      id: `${barbeiroId}-tarde`,
      inicio: "15:00",
      fim: "15:30",
      data,
    },
  ];
}

export async function carregarBloqueiosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Bloqueio[]> {
  return [
    {
      id: `${barbeiroId}-bloqueio-almoco`,
      inicio: "12:00",
      fim: "13:00",
      data,
    },
  ];
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
    const parsed = z
      .object({
        data: dataSchema,
        barbeiro_id: z.string().uuid(),
      })
      .safeParse(req.query);

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
      res.status(500).json({ mensagem: "Não foi possível carregar os horários." });
    }
  });
}

export function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/agendar", async (req: Request, res: Response) => {
    const parsed = z
      .object({
        cliente: z.string().min(1),
        telefone: z.string().min(1),
        servico: z.string().min(1),
        data: dataSchema,
        hora: horaSchema,
        barbeiro_id: z.string().uuid(),
      })
      .safeParse(req.body ?? {});

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
      res.status(500).json({ mensagem: "Não foi possível criar o agendamento." });
    }
  });
}
