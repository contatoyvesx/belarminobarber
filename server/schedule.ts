import express from "express";
import type { Express, Request, Response } from "express";
import {
  horariosQuerySchema,
  novoAgendamentoSchema,
} from "./validation";
import { supabase } from "./supabase";

export interface AgendaConfig {
  abre: string;
  fecha: string;
  duracao: number;
}

export interface Agendamento {
  id: string;
  inicio: string;
  fim: string;
  data: string;
}

export interface Bloqueio {
  id: string;
  inicio: string;
  fim: string;
  data: string;
}

export interface NovoAgendamento {
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  hora: string;
  barbeiro_id: string;
}

//
// ---------- UTILIDADES DE HORÁRIO ----------
//
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

//
// ---------- CONFIGURAÇÃO DO DIA ----------
//
export async function carregarConfigAgenda(
  barbeiroId: string,
  data: string,
): Promise<AgendaConfig> {
  
  // CORREÇÃO AQUI — agora domingo = 0 (compatível com Supabase)
  const diaDaSemana = new Date(data).getDay();

  console.log("📆 Buscando config agenda:", { barbeiroId, data, diaDaSemana });

  const { data: config, error } = await supabase
    .from("agenda_config")
    .select("abre, fecha, duracao")
    .eq("barbeiro_id", barbeiroId)
    .eq("dia_semana", diaDaSemana)
    .maybeSingle();

  console.log("🔍 Resultado config:", { config, error });

  if (error) {
    console.error("❌ Erro SQL config:", error);
    throw new Error("Erro ao buscar configuração de agenda.");
  }

  if (!config) {
    throw new Error(
      `Nenhuma configuração encontrada para barbeiro ${barbeiroId} no dia ${data} (dia_semana=${diaDaSemana})`
    );
  }

  return config;
}

//
// ---------- AGENDAMENTOS ----------
//
export async function carregarAgendamentosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Agendamento[]> {

  console.log("📆 Buscando agendamentos:", { data, barbeiroId });

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  console.log("🔍 Resultado agendamentos:", { agendamentos, error });

  if (error) {
    console.error("❌ Erro SQL agendamentos:", error);
    throw new Error("Erro ao buscar agendamentos.");
  }

  return agendamentos ?? [];
}

//
// ---------- BLOQUEIOS ----------
//
export async function carregarBloqueiosDoDia(
  data: string,
  barbeiroId: string,
): Promise<Bloqueio[]> {

  console.log("📆 Buscando bloqueios:", { data, barbeiroId });

  const { data: bloqueios, error } = await supabase
    .from("bloqueios")
    .select("inicio, fim")
    .eq("data", data)
    .eq("barbeiro_id", barbeiroId);

  console.log("🔍 Resultado bloqueios:", { bloqueios, error });

  if (error) {
    console.error("❌ Erro SQL bloqueios:", error);
    throw new Error("Erro ao buscar bloqueios.");
  }

  return bloqueios ?? [];
}

//
// ---------- GERA LISTA DE HORÁRIOS ----------
//
export function gerarHorariosPossiveis(config: AgendaConfig): string[] {
  const horarios: string[] = [];
  const inicio = minutosDoHorario(config.abre);
  const fim = minutosDoHorario(config.fecha);

  for (let atual = inicio; atual + config.duracao <= fim; atual += config.duracao) {
    horarios.push(horarioEmMinutos(atual));
  }

  return horarios;
}

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

//
// ---------- INSERIR AGENDAMENTO ----------
//
export async function inserirAgendamento(agendamento: NovoAgendamento) {
  const { data, error } = await supabase
    .from("agendamentos")
    .insert(agendamento)
    .select("*")
    .single();

  if (error) {
    console.error("❌ Erro ao inserir agendamento:", error);
    throw new Error("Não foi possível criar o agendamento.");
  }

  return data;
}

//
// ---------- ROTA: /horarios ----------
//
export function horariosRoute(app: Express) {
  app.get("/horarios", async (req: Request, res: Response) => {
    const parsed = horariosQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({ mensagem: "Parâmetros de consulta inválidos." });
    }

    const { data, barbeiro_id } = parsed.data;

    try {
      const [config, agendamentos, bloqueios] = await Promise.all([
        carregarConfigAgenda(barbeiro_id, data),
        carregarAgendamentosDoDia(data, barbeiro_id),
        carregarBloqueiosDoDia(data, barbeiro_id),
      ]);

      const base = gerarHorariosPossiveis(config);
      const livres = removerHorariosBloqueados(
        removerHorariosOcupados(base, agendamentos, config.duracao),
        bloqueios,
        config.duracao
      );

      res.json({ horarios: livres });
    } catch (error: any) {
      console.error("Erro ao carregar horários:", error.message);
      res.status(500).json({ mensagem: "Não foi possível carregar os horários." });
    }
  });
}

//
// ---------- ROTA: /agendar ----------
//
export function agendarRoute(app: Express) {
  app.use(express.json());

  app.post("/agendar", async (req: Request, res: Response) => {
    const parsed = novoAgendamentoSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return res.status(400).json({ mensagem: "Dados inválidos para agendar." });
    }

    const { data, hora, barbeiro_id } = parsed.data;

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

      if (!livres.includes(hora)) {
        return res.status(409).json({ mensagem: "Horário indisponível." });
      }

      const criado = await inserirAgendamento(parsed.data);

      res.status(201).json({ status: "confirmado", agendamento: criado });
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error.message);
      res.status(500).json({ mensagem: "Não foi possível criar o agendamento." });
    }
  });
}

//
// ---------- REGISTRO GERAL ----------
//
export function registrarRotasDeAgenda(app: Express) {
  horariosRoute(app);
  agendarRoute(app);
}
