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
