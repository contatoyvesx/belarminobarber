import express from "express";
import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";

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

export async function carregarConfigAgenda(): Promise<AgendaConfig> {
  return {
    abre: "09:00",
    fecha: "18:00",
    duracao: 30,
  };
}

export async function carregarAgendamentosDoDia(
  data: string,
): Promise<Agendamento[]> {
  return [
    {
      id: "1",
      inicio: "11:00",
      fim: "11:30",
      data,
    },
    {
      id: "2",
      inicio: "15:00",
      fim: "15:30",
      data,
    },
  ];
}

export async function carregarBloqueiosDoDia(
  data: string,
): Promise<Bloqueio[]> {
  return [
    {
      id: "bloqueio-almoco",
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
): string[] {
  const horariosIndisponiveis = new Set(
    agendamentos.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const intervalos: string[] = [];

      for (let minuto = inicioMin; minuto < fimMin; minuto += 1) {
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
): string[] {
  const horariosBloqueados = new Set(
    bloqueios.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const intervalos: string[] = [];

      for (let minuto = inicioMin; minuto < fimMin; minuto += 1) {
        intervalos.push(horarioEmMinutos(minuto));
      }

      return intervalos;
    }),
  );

  return horarios.filter((horario) => !horariosBloqueados.has(horario));
}

export function horariosRoute(app: Express) {
  app.get("/horarios", async (req: Request, res: Response) => {
    const data = (req.query.data as string) || new Date().toISOString().slice(0, 10);

    const config = await carregarConfigAgenda();
    const agendamentos = await carregarAgendamentosDoDia(data);
    const bloqueios = await carregarBloqueiosDoDia(data);

    const horariosBase = gerarHorariosPossiveis(config);
    const horariosLivres = removerHorariosBloqueados(
      removerHorariosOcupados(horariosBase, agendamentos),
      bloqueios,
    );

    res.json({ data, horarios: horariosLivres });
  });
}

export function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/agendamentos", async (req: Request, res: Response) => {
    const { horario, data, cliente } = req.body ?? {};

    if (!horario || !data || !cliente) {
      res.status(400).json({ mensagem: "Dados insuficientes para agendar." });
      return;
    }

    const agendamentos = await carregarAgendamentosDoDia(data);
    const existente = agendamentos.some(({ inicio }) => inicio === horario);

    if (existente) {
      res.status(409).json({ mensagem: "Horário indisponível." });
      return;
    }

    res.status(201).json({
      mensagem: "Agendamento criado com sucesso.",
      agendamento: { id: randomUUID(), horario, data, cliente },
    });
  });
}
