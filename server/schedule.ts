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

/* ================= ADMIN AUTH ================= */

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function isAdmin(req: Request) {
  const token =
    (req.headers["x-admin-token"] as string | undefined) ||
    (req.query.token as string | undefined) ||
    "";
  return ADMIN_TOKEN.length > 0 && token === ADMIN_TOKEN;
}

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
  for (let m = toMin(config.abre); m + config.duracao <= toMin(config.fecha); m += config.duracao) {
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

/* ================= ROTAS PÚBLICAS ================= */

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
      const livres = removerOcupados(removerOcupados(base, ag, config.duracao), bl, config.duracao);

      res.json({ horarios: livres });
    } catch (e: any) {
      res.status(500).json({ mensagem: "Erro ao buscar horários", detalhe: e?.message });
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
        status: "pendente",
      });

      if (error) throw error;

      res.status(201).json({ status: "confirmado" });
    } catch (e: any) {
      res.status(500).json({ mensagem: "Erro ao confirmar.", detalhe: e?.message });
    }
  });
}

/* ================= ROTAS ADMIN ================= */

function adminRoutes(app: Express) {
  // Listar agendamentos do dia
  app.get("/api/admin/agendamentos", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(401).json({ mensagem: "Não autorizado" });

    const data = String(req.query.data || "");
    const barbeiro_id = String(req.query.barbeiro_id || "");
    if (!data || !barbeiro_id) {
      return res.status(400).json({ mensagem: "data e barbeiro_id são obrigatórios" });
    }

    try {
      const { data: rows, error } = await supabase
        .from("agendamentos")
        .select("id, cliente, telefone, servico, data, inicio, fim, status")
        .eq("data", data)
        .eq("barbeiro_id", barbeiro_id)
        .order("inicio", { ascending: true });

      if (error) throw error;

      res.json({ agendamentos: rows ?? [] });
    } catch (e: any) {
      res.status(500).json({ mensagem: "Erro ao listar agendamentos", detalhe: e?.message });
    }
  });

  // Atualizar status: confirmado | cancelado
  app.patch("/api/admin/agendamentos/:id", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return res.status(401).json({ mensagem: "Não autorizado" });

    const id = req.params.id;
    const status = String(req.body?.status || "").trim();

    if (!id || !status) return res.status(400).json({ mensagem: "status obrigatório" });

    try {
      const { data: updated, error } = await supabase
        .from("agendamentos")
        .update({ status })
        .eq("id", id)
        .select("id, status")
        .single();

      if (error) throw error;

      res.json({ ok: true, agendamento: updated });
    } catch (e: any) {
      res.status(500).json({ mensagem: "Erro ao atualizar", detalhe: e?.message });
    }
  });
}

/* ================= EXPORT ÚNICO ================= */

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
  adminRoutes(app);
}
