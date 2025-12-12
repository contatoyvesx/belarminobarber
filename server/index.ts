import "./loadEnv";
import express from "express";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registrarRotasDeAgenda } from "./schedule";
import { supabase } from "./supabase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ✅ CORS — TEM QUE SER ANTES DE QUALQUER ROTA
  app.use(
    cors({
      origin: [
        "https://belarmino.yvesx.com.br",
        "https://www.belarmino.yvesx.com.br",
      ],
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Para preflight OPTIONS
  app.options("*", cors());

  // 🔥 ROTA DE HEALTHCHECK
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
        message: error?.message ?? "Não foi possível verificar o Supabase.",
      });
    }
  });

  // 🔥 ROTAS DA AGENDA
  registrarRotasDeAgenda(app);

  // 🔥 STATIC + SPA (se existir)
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "..", "frontend")
      : path.resolve(__dirname, "..", "dist", "frontend");

  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));

    // SPA fallback – ÚLTIMO
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
