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

//
// ---------- UTILIDADES DE HORÁRIO ----------
//
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

//
// ---------- CONFIGURAÇÃO DO DIA ----------
//
export async function carregarConfigAgenda(
  barbeiroId: string,
  data: string,
): Promise<AgendaConfig> {

  const [ano, mes, dia] = data.split("-").map(Number);
  const diaDaSemana = new Date(ano, mes - 1, dia).getDay();

  const { data: config, error } = await supabase
    .from("agenda_config")
    .select("abre, fecha, duracao")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaDaSemana)
    .limit(1)
    .single();

  if (error || !config) {
    throw new Error("Configuração de agenda não encontrada");
  }

  return config;
}

//
// ---------- AGENDAMENTOS ----------
//
export async function carregarAgendamentosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Agendamento[]> {

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error) throw error;

  return agendamentos ?? [];
}

//
// ---------- BLOQUEIOS ----------
//
export async function carregarBloqueiosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Bloqueio[]> {

  const { data: bloqueios, error } = await supabase
    .from("bloqueios")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error) throw error;

  return bloqueios ?? [];
}

//
// ---------- GERA LISTA DE HORÁRIOS ----------
//
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
  const ocupados = new Set(
    agendamentos.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const slots: string[] = [];

      for (let m = inicioMin; m < fimMin; m += passoMinutos) {
        slots.push(horarioEmMinutos(m));
      }

      return slots;
    })
  );

  return horarios.filter((h) => !ocupados.has(h));
}

export function removerHorariosBloqueados(
  horarios: string[],
  bloqueios: Bloqueio[],
  passoMinutos: number,
): string[] {
  const bloqueados = new Set(
    bloqueios.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const slots: string[] = [];

      for (let m = inicioMin; m < fimMin; m += passoMinutos) {
        slots.push(horarioEmMinutos(m));
      }

      return slots;
    })
  );

  return horarios.filter((h) => !bloqueados.has(h));
}

//
// ---------- INSERIR AGENDAMENTO (FIX REAL) ----------
//
export async function inserirAgendamento(
  agendamento: NovoAgendamento,
  duracao: number
) {
  const inicio = agendamento.hora;

  const [h, m] = inicio.split(":").map(Number);
  const fimMin = h * 60 + m + duracao;
  const fim = `${String(Math.floor(fimMin / 60)).padStart(2, "0")}:${String(
    fimMin % 60
  ).padStart(2, "0")}`;

  const payload = {
    cliente: agendamento.cliente,
    telefone: agendamento.telefone,
    servico: agendamento.servico,
    data: agendamento.data,
    barbeiro_id: agendamento.barbeiro_id,
    inicio,
    fim,
  };

  const { data, error } = await supabase
    .from("agendamentos")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

//
// ---------- ROTA: /horarios ----------
//
export function horariosRoute(app: Express) {
  app.get("/api/horarios", async (req: Request, res: Response) => {
    const parsed = horariosQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ mensagem: "Parâmetros inválidos" });
    }

    const { data, barbeiro_id } = parsed.data;

    try {
      const [config, agendamentos, bloqueios] = await Promise.all([
        carregarConfigAgenda(barbeiro_id, data),
        carregarAgendamentosDoDia(data, barbeiro_id),
        carregarBloqueiosDoDia(data, barbeiro_id),
      ]);

      const base = gerarHorariosPossiveis(config);
      const livres = removerHorariosBloqueados(
        removerHorariosOcupados(base, agendamentos, config.duracao),
        bloqueios,
        config.duracao
      );

      res.json({ horarios: livres });
    } catch {
      res.status(500).json({ mensagem: "Não foi possível carregar os horários." });
    }
  });
}

//
// ---------- ROTA: /agendar ----------
//
export function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: Request, res: Response) => {
    const parsed = novoAgendamentoSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ mensagem: "Dados inválidos" });
    }

    const { data, hora, barbeiro_id } = parsed.data;

    try {
      const [config, agendamentos, bloqueios] = await Promise.all([
        carregarConfigAgenda(barbeiro_id, data),
        carregarAgendamentosDoDia(data, barbeiro_id),
        carregarBloqueiosDoDia(data, barbeiro_id),
      ]);

      const livres = removerHorariosBloqueados(
        removerHorariosOcupados(
          gerarHorariosPossiveis(config),
          agendamentos,
          config.duracao
        ),
        bloqueios,
        config.duracao
      );

      if (!livres.includes(hora)) {
        return res.status(409).json({ mensagem: "Horário indisponível" });
      }

      const criado = await inserirAgendamento(parsed.data, config.duracao);
      res.status(201).json({ status: "confirmado", agendamento: criado });
    } catch {
      res.status(500).json({ mensagem: "Não foi possível criar o agendamento." });
    }
  });
}

//
// ---------- REGISTRO ----------
//
export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
