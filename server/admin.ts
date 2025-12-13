import type { Express, Request, Response } from "express";
import { supabase } from "./supabase";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function auth(req: Request): boolean {
  const token =
    (req.headers["x-admin-token"] as string | undefined) ||
    (req.query.token as string | undefined) ||
    "";

  return ADMIN_TOKEN.length > 0 && token === ADMIN_TOKEN;
}

export function registrarRotasAdmin(app: Express) {

  // =========================
  // LISTAR BARBEIROS (NOME)
  // =========================
  app.get("/api/admin/barbeiros", async (req: Request, res: Response) => {
    if (!auth(req)) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    try {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;

      res.json({ barbeiros: data ?? [] });
    } catch (e: any) {
      res.status(500).json({
        mensagem: "Erro ao listar barbeiros",
        detalhe: e?.message,
      });
    }
  });

  // =========================
  // LISTAR AGENDAMENTOS
  // =========================
  app.get("/api/admin/agendamentos", async (req: Request, res: Response) => {
    if (!auth(req)) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    const data = String(req.query.data || "");
    const barbeiro_id = String(req.query.barbeiro_id || "");

    if (!data || !barbeiro_id) {
      return res
        .status(400)
        .json({ mensagem: "data e barbeiro_id são obrigatórios" });
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
      res.status(500).json({
        mensagem: "Erro ao listar agendamentos",
        detalhe: e?.message,
      });
    }
  });

  // =========================
  // ATUALIZAR STATUS
  // =========================
  app.patch("/api/admin/agendamentos/:id", async (req: Request, res: Response) => {
    if (!auth(req)) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    const id = req.params.id;
    const status = String(req.body?.status ?? "").trim();

    if (!id || !status) {
      return res.status(400).json({ mensagem: "status obrigatório" });
    }

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
      res.status(500).json({
        mensagem: "Erro ao atualizar",
        detalhe: e?.message,
      });
    }
  });
}
