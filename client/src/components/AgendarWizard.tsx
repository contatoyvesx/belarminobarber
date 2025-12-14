import React, { useEffect, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { BarbeiroCard, type Barbeiro } from "./BarbeiroCard";
import StepDots from "./StepDots";

const API = "/api";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

const servicosPadrao = [
  "Corte de cabelo",
  "Barba",
  "Sobrancelha",
  "Hidratação capilar",
  "Limpeza de pele / black mask",
  "Camuflagem de fios brancos",
];

const steps = [
  "Escolha o barbeiro",
  "Escolha a data e horário",
  "Serviços e dados",
  "Confirmar",
];

function formatDatePtBr(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export default function AgendarWizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<Barbeiro | null>(null);
  const [loadingBarbeiros, setLoadingBarbeiros] = useState(false);
  const [barbeiroErro, setBarbeiroErro] = useState("");

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horariosLoading, setHorariosLoading] = useState(false);
  const [horariosErro, setHorariosErro] = useState("");
  const [selectedHora, setSelectedHora] = useState("");

  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");

  const [feedback, setFeedback] = useState<{ tipo: "erro" | "sucesso"; mensagem: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const servicos = useMemo(() => servicosPadrao, []);

  useEffect(() => {
    async function carregarBarbeiros() {
      setLoadingBarbeiros(true);
      setBarbeiroErro("");
      try {
        const query = ADMIN_TOKEN ? `?token=${ADMIN_TOKEN}` : "";
        const res = await fetch(`${API}/admin/barbeiros${query}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json?.mensagem || "Erro ao carregar barbeiros");
        setBarbeiros(json.barbeiros || []);
      } catch (e: any) {
        setBarbeiroErro(e?.message || "Erro ao carregar barbeiros.");
        setBarbeiros([]);
      } finally {
        setLoadingBarbeiros(false);
      }
    }

    carregarBarbeiros();
  }, []);

  useEffect(() => {
    setSelectedHora("");
    setHorarios([]);
    setHorariosErro("");
  }, [selectedBarbeiro, selectedDate]);

  const dataParaExibicao = useMemo(() => formatDatePtBr(selectedDate), [selectedDate]);

  async function buscarHorarios() {
    if (!selectedBarbeiro) {
      setHorariosErro("Selecione um barbeiro.");
      return;
    }

    setHorariosLoading(true);
    setHorariosErro("");
    setHorarios([]);

    try {
      const res = await fetch(
        `${API}/horarios?data=${encodeURIComponent(selectedDate)}&barbeiro_id=${selectedBarbeiro.id}`
      );

      if (!res.ok) {
        throw new Error("Erro ao buscar horários");
      }

      const json = await res.json();

      const lista = Array.isArray(json?.horarios)
        ? json.horarios
        : Array.isArray(json)
        ? json
        : [];

      setHorarios(lista);

      if (lista.length === 0) {
        setHorariosErro("Nenhum horário disponível para esta data.");
      }
    } catch {
      setHorariosErro("Erro ao buscar horários.");
    } finally {
      setHorariosLoading(false);
    }
  }

  const podeAvancar = useMemo(() => {
    if (currentStep === 1) return Boolean(selectedBarbeiro);
    if (currentStep === 2) return Boolean(selectedHora);
    if (currentStep === 3)
      return Boolean(cliente.trim() && telefone.trim() && servicosSelecionados.length);
    return true;
  }, [currentStep, selectedBarbeiro, selectedHora, cliente, telefone, servicosSelecionados]);

  const servicosFormatados = servicosSelecionados.join(", ");

  async function confirmarAgendamento() {
    if (!selectedBarbeiro || !selectedHora || !cliente || !telefone || !servicosSelecionados.length) {
      setFeedback({ tipo: "erro", mensagem: "Preencha todos os campos." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          telefone,
          servico: servicosFormatados,
          data: selectedDate,
          hora: selectedHora,
          barbeiro_id: selectedBarbeiro.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.mensagem || "Erro ao confirmar");

      setFeedback({ tipo: "sucesso", mensagem: "Agendamento confirmado com sucesso!" });
    } catch (e: any) {
      setFeedback({ tipo: "erro", mensagem: e.message || "Erro ao confirmar agendamento." });
    } finally {
      setSubmitting(false);
    }
  }

  function avancar() {
    if (!podeAvancar) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length));
  }

  function voltar() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div>
      {/* layout mantido */}
    </div>
  );
}
