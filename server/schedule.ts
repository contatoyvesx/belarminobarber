import type { Express, Request, Response } from "express";
import express from "express";
import { horariosQuerySchema, novoAgendamentoSchema } from "./validation";
import { supabase } from "./supabase";

/* ================= TIPOS ================= */

interface AgendaConfig {
  abre: string;
  fecha: string;
  duracao: number;
}

interface Intervalo {
  inicio: string;
  fim: string;
}

/* ================= UTILS ================= */

const toMin = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
};

const toHora = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/* ================= DB ================= */

async function carregarConfigAgenda(barbeiroId: string, data: string): Promise<AgendaConfig> {
  const [y, m, d] = data.split("-").map(Number);
  const diaSemana = new Date(y, m - 1, d).getDay();

  const { data: config, error } = await supabase
    .from("agenda_config")
    .select("abre, fecha, duracao")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaSemana)
    .single();

  if (error || !config) throw error;
  return config;
}

async function carregarAgendamentos(data: string, barbeiroId: string): Promise<Intervalo[]> {
  const { data: a, error } = await supabase
    .from("agendamentos")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error) throw error;
  return a ?? [];
}

async function carregarBloqueios(data: string, barbeiroId: string): Promise<Intervalo[]> {
  const { data: b, error } = await supabase
    .from("bloqueios")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  if (error) throw error;
  return b ?? [];
}

/* ================= LÓGICA ================= */

function gerarHorarios(config: AgendaConfig): string[] {
  const h: string[] = [];
  for (
    let m = toMin(config.abre);
    m + config.duracao <= toMin(config.fecha);
    m += config.duracao
  ) {
    h.push(toHora(m));
  }
  return h;
}

function removerOcupados(base: string[], intervalos: Intervalo[], passo: number) {
  const set = new Set(
    intervalos.flatMap(({ inicio, fim }) => {
      const a = toMin(inicio);
      const b = toMin(fim);
      const r: string[] = [];
      for (let m = a; m < b; m += passo) r.push(toHora(m));
      return r;
    })
  );
  return base.filter((h) => !set.has(h));
}

/* ================= ROTAS ================= */

function horariosRoute(app: Express) {
  app.get("/api/horarios", async (req: Request, res: Response) => {
    const parsed = horariosQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({});

    const { data, barbeiro_id } = parsed.data;

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const ag = await carregarAgendamentos(data, barbeiro_id);
      const bl = await carregarBloqueios(data, barbeiro_id);

      const base = gerarHorarios(config);
      const livres = removerOcupados(
        removerOcupados(base, ag, config.duracao),
        bl,
        config.duracao
      );

      res.json({ horarios: livres });
    } catch {
      res.status(500).json({ mensagem: "Erro ao buscar horários" });
    }
  });
}

function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: Request, res: Response) => {
    const parsed = novoAgendamentoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({});

    const { data, hora, barbeiro_id } = parsed.data;

    try {
      const config = await carregarConfigAgenda(barbeiro_id, data);
      const inicio = hora;
      const fim = toHora(toMin(hora) + config.duracao);

      const { error } = await supabase.from("agendamentos").insert({
        ...parsed.data,
        inicio,
        fim,
      });

      if (error) throw error;

      res.status(201).json({ status: "confirmado" });
    } catch {
      res.status(500).json({ mensagem: "Erro ao confirmar." });
    }
  });
}

/* ================= EXPORT ÚNICO ================= */

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
