import "./loadEnv";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { registrarRotasDeAgenda } from "./schedule";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // 🔥 ROTA DE HEALTHCHECK (IMPORTANTE: antes de tudo!)
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // 🔥 ROTAS DO SEU BACKEND REAL
  registrarRotasDeAgenda(app);

  // 🔥 STATIC + FRONTEND SPA
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // 🔥 SPA fallback – sempre por ÚLTIMO
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
