import express from "express";
import type { Express, Request, Response } from "express";
import { horariosQuerySchema, novoAgendamentoSchema } from "./validation";
import { supabase } from "./supabase";

export interface AgendaConfig {
  abre: string;
  fecha: string;
  duracao: number;
}

export interface Agendamento {
  inicio: string;
  fim: string;
}

export interface Bloqueio {
  inicio: string;
  fim: string;
}

export interface NovoAgendamento {
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  hora: string;
  barbeiro_id: string;
}

const minutos = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};

const horario = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

async function carregarConfigAgenda(barbeiroId: string, data: string): Promise<AgendaConfig> {
  const [y, m, d] = data.split("-").map(Number);
  const dia = new Date(y, m - 1, d).getDay();

  const { data: config, error } = await supabase
    .from("agenda_config")
    .select("abre, fecha, duracao")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", dia)
    .limit(1)
    .single();

  if (error || !config) throw error;
  return config;
}

async function carregarAgendamentos(data: string, barbeiroId: string) {
  const { data: a, error } = await supabase
    .from("agendamentos")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error) throw error;
  return a ?? [];
}

async function carregarBloqueios(data: string, barbeiroId: string) {
  const { data: b, error } = await supabase
    .from("bloqueios")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error) throw error;
  return b ?? [];
}

function gerarHorarios(config: AgendaConfig) {
  const h: string[] = [];
  for (
    let m = minutos(config.abre);
    m + config.duracao <= minutos(config.fecha);
    m += config.duracao
  ) {
    h.push(horario(m));
  }
  return h;
}

function remover(h: string[], lista: { inicio: string; fim: string }[], dur: number) {
  const set = new Set(
    lista.flatMap(({ inicio, fim }) => {
      const a = minutos(inicio);
      const b = minutos(fim);
      const r: string[] = [];
      for (let m = a; m < b; m += dur) r.push(horario(m));
      return r;
    })
  );
  return h.filter((x) => !set.has(x));
}

export function horariosRoute(app: Express) {
  app.get("/api/horarios", async (req, res) => {
    const parsed = horariosQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({});

    const { data, barbeiro_id } = parsed.data;

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const ag = await carregarAgendamentos(data, barbeiro_id);
      const bl = await carregarBloqueios(data, barbeiro_id);

      const base = gerarHorarios(config);
      const livres = remover(remover(base, ag, config.duracao), bl, config.duracao);

      res.json({ horarios: livres });
    } catch {
      res.status(500).json({ mensagem: "Erro ao buscar horários" });
    }
  });
}

export function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: Request, res: Response) => {
    const parsed = novoAgendamentoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({});

    const { data, hora, barbeiro_id } = parsed.data;

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);

      const ini = hora;
      const fim = horario(minutos(hora) + config.duracao);

      const { error } = await supabase.from("agendamentos").insert({
        ...parsed.data,
        inicio: ini,
        fim,
      });

      if (error) throw error;

      res.status(201).json({ status: "ok" });
    } catch {
      res.status(500).json({ mensagem: "Erro ao agendar" });
    }
  });
}

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
