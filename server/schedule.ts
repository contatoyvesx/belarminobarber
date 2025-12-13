import express from "express";
import fs from "fs";
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { registrarRotasDeAgenda } from "./schedule";
import { supabase } from "./supabase";

// Utilitário para converter horários em minutos
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

// Função para gerar os horários possíveis de acordo com a duração
export function gerarHorariosPossiveis(config: AgendaConfig): string[] {
  const horarios: string[] = [];
  const inicio = minutosDoHorario(config.abre);
  const fim = minutosDoHorario(config.fecha);

  for (let atual = inicio; atual + config.duracao <= fim; atual += config.duracao) {
    horarios.push(horarioEmMinutos(atual));
  }

  return horarios;
}

// Função para remover horários ocupados
export function removerHorariosOcupados(
  horarios: string[],
  agendamentos: Agendamento[],
  passoMinutos: number,
): string[] {
  const ocupados = new Set(
    agendamentos.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const intervalos: string[] = [];

      for (let m = inicioMin; m < fimMin; m += passoMinutos) {
        intervalos.push(horarioEmMinutos(m));
      }

      return intervalos;
    })
  );

  return horarios.filter((h) => !ocupados.has(h));
}

// Função para validar se o horário está bloqueado ou ocupado
export function removerHorariosBloqueados(
  horarios: string[],
  bloqueios: Bloqueio[],
  passoMinutos: number,
): string[] {
  const bloqueados = new Set(
    bloqueios.flatMap(({ inicio, fim }) => {
      const inicioMin = minutosDoHorario(inicio);
      const fimMin = minutosDoHorario(fim);
      const intervalos: string[] = [];

      for (let m = inicioMin; m < fimMin; m += passoMinutos) {
        intervalos.push(horarioEmMinutos(m));
      }

      return intervalos;
    })
  );

  return horarios.filter((h) => !bloqueados.has(h));
}

// Rota de agendamento que verifica se os horários estão disponíveis
export function agendarRoute(app: express.Express) {
  app.use(express.json());

  app.post("/api/agendar", async (req: express.Request, res: express.Response) => {
    const { data, hora, barbeiro_id } = req.body;

    // Recuperando a configuração de horário e os agendamentos existentes
    try {
      const [config, agendamentos, bloqueios] = await Promise.all([
        carregarConfigAgenda(barbeiro_id, data),
        carregarAgendamentosDoDia(data, barbeiro_id),
        carregarBloqueiosDoDia(data, barbeiro_id),
      ]);

      const livres = removerHorariosBloqueados(
        removerHorariosOcupados(gerarHorariosPossiveis(config), agendamentos, config.duracao),
        bloqueios,
        config.duracao
      );

      // Verifica se o horário escolhido está disponível
      if (!livres.includes(hora)) {
        return res.status(409).json({ mensagem: "Horário indisponível." });
      }

      // Inserindo o agendamento
      const criado = await inserirAgendamento({
        cliente: req.body.cliente,
        telefone: req.body.telefone,
        servico: req.body.servico,
        data,
        hora,
        barbeiro_id,
      });

      return res.status(201).json({ status: "confirmado", agendamento: criado });
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error.message);
      res.status(500).json({ mensagem: "Não foi possível criar o agendamento." });
    }
  });
}

// Função principal para iniciar o servidor
async function startServer() {
  const app = express();
  const server = createServer(app);

  // Rota de healthcheck
  app.get("/api/health", async (_req, res) => {
    try {
      const { error } = await supabase.from("agenda_config").select("id").limit(1);

      if (error) {
        throw error;
      }

      res.json({ status: "ok", supabase: "connected" });
    } catch (error: any) {
      res.status(500).json({ status: "error", supabase: "disconnected", message: error?.message ?? "Não foi possível verificar o Supabase." });
    }
  });

  // Registrando rotas de agendamento
  registrarRotasDeAgenda(app);

  // Serve arquivos estáticos se existir build
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "..", "frontend") : path.resolve(__dirname, "..", "dist", "frontend");

  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));

    // SPA fallback
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

export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
