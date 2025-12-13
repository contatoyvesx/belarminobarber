import React, { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { BarbeiroCard, type Barbeiro } from "./BarbeiroCard";
import StepDots from "./StepDots";

const API = import.meta.env.VITE_API_URL || "/api";

/* ================= CONFIG ================= */

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

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

function formatDatePtBr(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR");
}

/* ================= COMPONENT ================= */

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

  /* ================= BARBEIROS (PUBLICO) ================= */

  useEffect(() => {
    async function carregarBarbeiros() {
      setLoadingBarbeiros(true);
      setBarbeiroErro("");

      try {
        const res = await fetch(`${API}/barbeiros`);
        const json = await res.json();

        if (!res.ok) throw new Error(json?.mensagem || "Erro ao carregar barbeiros");

        setBarbeiros(json.barbeiros || []);
      } catch (e: any) {
        setBarbeiroErro(e.message || "Erro ao carregar barbeiros");
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

  /* ================= HORÁRIOS ================= */

  async function buscarHorarios() {
    if (!selectedBarbeiro) {
      setHorariosErro("Selecione um barbeiro.");
      return;
    }

    setHorariosLoading(true);
    setHorarios([]);
    setHorariosErro("");

    try {
      const res = await fetch(
        `${API}/horarios?data=${selectedDate}&barbeiro_id=${selectedBarbeiro.id}`
      );
      const json = await res.json();

      if (!res.ok) throw new Error(json?.mensagem || "Erro ao buscar horários");

      setHorarios(json.horarios || []);
      if (!json.horarios?.length) {
        setHorariosErro("Nenhum horário disponível.");
      }
    } catch (e: any) {
      setHorariosErro(e.message || "Erro ao buscar horários");
    } finally {
      setHorariosLoading(false);
    }
  }

  /* ================= CONFIRMAR ================= */

  const podeAvancar = useMemo(() => {
    if (currentStep === 1) return !!selectedBarbeiro;
    if (currentStep === 2) return !!(selectedHora && selectedDate);
    if (currentStep === 3)
      return !!(cliente.trim() && telefone.trim() && servicosSelecionados.length);
    return true;
  }, [currentStep, selectedBarbeiro, selectedHora, selectedDate, cliente, telefone, servicosSelecionados]);

  async function confirmarAgendamento() {
    if (!selectedBarbeiro) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          telefone,
          servico: servicosSelecionados.join(", "),
          data: selectedDate,
          hora: selectedHora,
          barbeiro_id: selectedBarbeiro.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.mensagem || "Erro ao confirmar");

      setFeedback({ tipo: "sucesso", mensagem: "Agendamento confirmado com sucesso!" });

      const resumo = `Agendamento confirmado:
🧔 ${cliente}
📅 ${formatDatePtBr(selectedDate)}
⏰ ${selectedHora}
💈 ${servicosSelecionados.join(", ")}
✂️ ${selectedBarbeiro.nome}`;

      window.open(
        `https://wa.me/5511952861321?text=${encodeURIComponent(resumo)}`,
        "_blank"
      );
    } catch (e: any) {
      setFeedback({ tipo: "erro", mensagem: e.message || "Erro ao confirmar" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-[#2c120e] bg-[#120404] p-6 text-[#F4E0C9]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#d1aa74]">Agendamento</p>
          <h1 className="text-3xl font-bold">{steps[currentStep - 1]}</h1>
        </div>
        <StepDots currentStep={currentStep} steps={steps} />
      </div>

      {currentStep === 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {loadingBarbeiros && <p>Carregando barbeiros...</p>}
          {barbeiroErro && <p className="text-red-400">{barbeiroErro}</p>}
          {barbeiros.map((b) => (
            <BarbeiroCard
              key={b.id}
              barbeiro={b}
              selected={selectedBarbeiro?.id === b.id}
              onSelect={setSelectedBarbeiro}
            />
          ))}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <input
            type="date"
            min={todayISO()}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl bg-black p-3"
          />
          <button onClick={buscarHorarios} className="rounded-xl bg-[#D9A66A] px-4 py-2 text-black">
            Buscar horários
          </button>

          <div className="grid grid-cols-3 gap-2">
            {horarios.map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHora(h)}
                className={`rounded-full px-3 py-2 ${
                  selectedHora === h ? "bg-[#D9A66A] text-black" : "bg-black"
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {horariosErro && <p className="text-red-400">{horariosErro}</p>}
        </div>
      )}

      {currentStep === 3 && (
        <div className="grid gap-4">
          {servicosPadrao.map((s) => (
            <label key={s} className="flex items-center gap-3">
              <Checkbox
                checked={servicosSelecionados.includes(s)}
                onCheckedChange={() =>
                  setServicosSelecionados((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                  )
                }
              />
              {s}
            </label>
          ))}

          <input
            placeholder="Seu nome"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="rounded-xl bg-black p-3"
          />
          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="rounded-xl bg-black p-3"
          />
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-2">
          <p>Barbeiro: {selectedBarbeiro?.nome}</p>
          <p>Data: {formatDatePtBr(selectedDate)}</p>
          <p>Hora: {selectedHora}</p>
          <p>Serviços: {servicosSelecionados.join(", ")}</p>
        </div>
      )}

      {feedback && (
        <div className={`mt-4 ${feedback.tipo === "erro" ? "text-red-400" : "text-green-400"}`}>
          {feedback.mensagem}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          disabled={currentStep === 1}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
        >
          Voltar
        </button>

        {currentStep < steps.length && (
          <button
            disabled={!podeAvancar}
            onClick={() => setCurrentStep((s) => s + 1)}
            className="rounded-xl bg-[#D9A66A] px-4 py-2 text-black"
          >
            Próximo
          </button>
        )}

        {currentStep === steps.length && (
          <button
            onClick={confirmarAgendamento}
            disabled={submitting}
            className="rounded-xl bg-[#D9A66A] px-4 py-2 text-black"
          >
            {submitting ? "Enviando..." : "Confirmar"}
          </button>
        )}
      </div>
    </div>
  );
}
