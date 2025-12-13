import "./loadEnv";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import { registrarRotasDeAgenda } from "./schedule";
import { registrarRotasAdmin } from "./admin";
import { supabase } from "./supabase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // =========================
  // MIDDLEWARES
  // =========================
  app.use(express.json());

  // =========================
  // HEALTHCHECK
  // =========================
  app.get("/api/health", async (_req, res) => {
    try {
      const { error } = await supabase
        .from("agenda_config")
        .select("id")
        .limit(1);

      if (error) throw error;

      res.json({ status: "ok", supabase: "connected" });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        supabase: "disconnected",
        message: error?.message ?? "Erro ao conectar no Supabase",
      });
    }
  });

  // =========================
  // ROTAS DE API
  // =========================
  registrarRotasDeAgenda(app);
  registrarRotasAdmin(app);

  // =========================
  // FRONTEND (SPA)
  // =========================
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "..", "frontend")
      : path.resolve(__dirname, "..", "dist", "frontend");

  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));

    // SPA fallback — SEMPRE POR ÚLTIMO
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  // =========================
  // START SERVER
  // =========================
  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});
