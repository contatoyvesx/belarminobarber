import "./loadEnv";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registrarRotasDeAgenda } from "./schedule";
import { supabase } from "./supabase";
import { registrarRotasAdmin } from "./admin";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ✅ CORS MANUAL (SEM DEPENDÊNCIA)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://belarmino.yvesx.com.br");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  // 🔥 HEALTHCHECK
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
        message: error?.message ?? "Erro Supabase",
      });
    }
  });

  // 🔥 ROTAS DA AGENDA
  registrarRotasDeAgenda(app);

  // 🔥 STATIC + SPA
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "..", "frontend")
      : path.resolve(__dirname, "..", "dist", "frontend");

  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));

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
