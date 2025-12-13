import React, { useEffect, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { BarbeiroCard, type Barbeiro } from "./BarbeiroCard";
import StepDots from "./StepDots";

const API = import.meta.env.VITE_API_URL || "/api";
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
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
      } catch (error: any) {
        setBarbeiroErro(error?.message || "Não foi possível carregar os barbeiros.");
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
  }, [selectedBarbeiro]);

  const dataParaExibicao = useMemo(() => formatDatePtBr(selectedDate), [selectedDate]);

  async function buscarHorarios() {
    if (!selectedBarbeiro) {
      setHorariosErro("Selecione um barbeiro antes de buscar.");
      return;
    }

    if (!selectedDate) {
      setHorariosErro("Escolha uma data para ver os horários.");
      return;
    }

    setHorariosLoading(true);
    setHorarios([]);
    setHorariosErro("");

    try {
      const res = await fetch(
        `${API}/horarios?data=${encodeURIComponent(selectedDate)}&barbeiro_id=${selectedBarbeiro.id}`
      );
      const json = await res.json();

      if (json.horarios) {
        setHorarios(json.horarios);
        if (!json.horarios.length) {
          setHorariosErro("Nenhum horário disponível para esta data. Tente outro dia.");
        }
      } else {
        setHorarios([]);
        setHorariosErro("Nenhum horário disponível para esta data. Tente outro dia.");
      }
    } catch (error) {
      console.error(error);
      setHorariosErro("Erro ao buscar horários.");
    } finally {
      setHorariosLoading(false);
    }
  }

  const podeAvancar = useMemo(() => {
    if (currentStep === 1) return Boolean(selectedBarbeiro);
    if (currentStep === 2) return Boolean(selectedHora && selectedDate);
    if (currentStep === 3) return Boolean(cliente.trim() && telefone.trim() && servicosSelecionados.length);
    return true;
  }, [cliente, currentStep, selectedBarbeiro, selectedDate, selectedHora, servicosSelecionados.length, telefone]);

  const servicosFormatados = servicosSelecionados.join(", ");

  async function confirmarAgendamento() {
    if (!selectedBarbeiro || !selectedDate || !selectedHora || !cliente || !telefone || !servicosSelecionados.length) {
      setFeedback({ tipo: "erro", mensagem: "Preencha todos os campos antes de confirmar." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      cliente,
      telefone,
      servico: servicosFormatados,
      data: selectedDate,
      hora: selectedHora,
      barbeiro_id: selectedBarbeiro.id,
    };

    try {
      const res = await fetch(`${API}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.status === "confirmado") {
        setFeedback({ tipo: "sucesso", mensagem: "Agendamento confirmado com sucesso!" });

        const resumo = `Novo agendamento confirmado:\n\n🧔 Cliente: ${cliente}\n📅 Data: ${dataParaExibicao}\n⏰ Hora: ${selectedHora}\n💈 Serviço: ${servicosFormatados}\n✂️ Barbeiro: ${selectedBarbeiro.nome}`;
        window.open(`https://wa.me/5511952861321?text=${encodeURIComponent(resumo)}`, "_blank");
      } else {
        setFeedback({ tipo: "erro", mensagem: json.mensagem || "Erro ao confirmar." });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ tipo: "erro", mensagem: "Erro ao enviar agendamento." });
    } finally {
      setSubmitting(false);
    }
  }

  function avancar() {
    if (!podeAvancar || currentStep >= steps.length) return;
    setFeedback(null);
    setCurrentStep((step) => Math.min(step + 1, steps.length));
  }

  function voltar() {
    setFeedback(null);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-[#2c120e] bg-gradient-to-br from-[#140000]/95 via-[#1b0402]/95 to-[#0b0403]/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,166,106,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(110,35,23,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(217,166,106,0.1),transparent_25%)]" />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#d1aa74]">Agende seu horário</p>
            <h1 className="text-3xl font-bold text-[#F5E9D9]">{steps[currentStep - 1]}</h1>
          </div>
          <StepDots currentStep={currentStep} steps={steps} />
        </div>

        <div className="grid gap-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-[#d1aa74]">Selecione quem vai cuidar de você hoje</p>
              {loadingBarbeiros && <p className="text-sm text-[#E8C8A3]">Carregando barbeiros...</p>}
              {barbeiroErro && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {barbeiroErro}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {barbeiros.map((barbeiro) => (
                  <BarbeiroCard
                    key={barbeiro.id}
                    barbeiro={barbeiro}
                    selected={selectedBarbeiro?.id === barbeiro.id}
                    onSelect={(b) => setSelectedBarbeiro(b)}
                  />
                ))}
              </div>
              {!loadingBarbeiros && !barbeiros.length && !barbeiroErro && (
                <p className="text-sm text-[#E8C8A3] opacity-80">Nenhum barbeiro disponível no momento.</p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_auto] sm:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#d1aa74]" htmlFor="data-agendamento">
                    Data do atendimento
                  </label>
                  <input
                    id="data-agendamento"
                    type="date"
                    min={todayISO()}
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setHorariosErro("");
                    }}
                    className="w-full rounded-xl border border-[#2c120e] bg-[#120404] p-3 text-[#F4E0C9] shadow-inner shadow-black/30 focus:border-[#D9A66A] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={buscarHorarios}
                  disabled={horariosLoading || !selectedBarbeiro}
                  className="w-full rounded-xl border border-[#D9A66A]/60 bg-[#D9A66A] px-4 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(217,166,106,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {horariosLoading ? "Buscando..." : "Buscar horários"}
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#d1aa74]">Horários disponíveis</p>
                {horariosErro && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {horariosErro}
                  </div>
                )}
                {!horariosLoading && !horarios.length && !horariosErro && (
                  <p className="text-sm text-[#E8C8A3] opacity-80">Nenhum horário listado ainda.</p>
                )}
                {horariosLoading && <p className="text-sm text-[#E8C8A3]">Carregando horários...</p>}
                {!horariosLoading && horarios.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {horarios.map((hora) => {
                      const ativo = selectedHora === hora;
                      return (
                        <button
                          key={hora}
                          type="button"
                          onClick={() => setSelectedHora(hora)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            ativo
                              ? "border-[#D9A66A] bg-[#D9A66A] text-black shadow-[0_0_18px_rgba(217,166,106,0.35)]"
                              : "border-[#2c120e] bg-[#140505] text-[#E8C8A3] hover:border-[#D9A66A]/40 hover:text-[#D9A66A]"
                          }`}
                        >
                          {hora}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedHora && (
                  <p className="text-sm text-[#E8C8A3]">
                    Horário escolhido: <span className="text-[#D9A66A]">{selectedHora}</span> - {dataParaExibicao}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#d1aa74]">Selecione os serviços</p>
                <div className="space-y-3">
                  {servicos.map((servico) => {
                    const marcado = servicosSelecionados.includes(servico);
                    return (
                      <label
                        key={servico}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                          marcado
                            ? "border-[#D9A66A]/80 bg-[#20100d]/90 shadow-[0_0_18px_rgba(217,166,106,0.25)]"
                            : "border-[#2c120e] bg-[#150605]/80 hover:border-[#D9A66A]/40"
                        }`}
                      >
                        <Checkbox
                          checked={marcado}
                          onCheckedChange={() => {
                            setServicosSelecionados((prev) =>
                              prev.includes(servico)
                                ? prev.filter((s) => s !== servico)
                                : [...prev, servico]
                            );
                            setFeedback(null);
                          }}
                          className="border-[#6e2317] data-[state=checked]:border-[#D9A66A] data-[state=checked]:bg-[#D9A66A]"
                        />
                        <span className="text-sm text-[#F4E0C9]">{servico}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#d1aa74]" htmlFor="cliente">
                    Seu nome
                  </label>
                  <input
                    id="cliente"
                    type="text"
                    value={cliente}
                    onChange={(e) => {
                      setCliente(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="Digite seu nome"
                    className="w-full rounded-xl border border-[#2c120e] bg-[#120404] p-3 text-[#F4E0C9] shadow-inner shadow-black/30 focus:border-[#D9A66A] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#d1aa74]" htmlFor="telefone">
                    Telefone com DDD
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    inputMode="tel"
                    value={telefone}
                    onChange={(e) => {
                      setTelefone(e.target.value);
                      setFeedback(null);
                    }}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-[#2c120e] bg-[#120404] p-3 text-[#F4E0C9] shadow-inner shadow-black/30 focus:border-[#D9A66A] focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-[#2c120e] bg-[#140505] p-4 text-sm text-[#E8C8A3]">
                  <p className="font-semibold text-[#d1aa74]">Dica:</p>
                  <p>
                    Informe um telefone com WhatsApp para confirmarmos seu horário rapidamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-[#2c120e] bg-[#150605]/80 p-4">
                <p className="text-sm font-semibold text-[#d1aa74]">Dados do agendamento</p>
                <ul className="space-y-2 text-sm text-[#F4E0C9]">
                  <li><strong className="text-[#D9A66A]">Barbeiro:</strong> {selectedBarbeiro?.nome}</li>
                  <li><strong className="text-[#D9A66A]">Data:</strong> {dataParaExibicao}</li>
                  <li><strong className="text-[#D9A66A]">Horário:</strong> {selectedHora}</li>
                  <li><strong className="text-[#D9A66A]">Serviços:</strong> {servicosFormatados}</li>
                </ul>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#2c120e] bg-[#150605]/80 p-4">
                <p className="text-sm font-semibold text-[#d1aa74]">Seus dados</p>
                <ul className="space-y-2 text-sm text-[#F4E0C9]">
                  <li><strong className="text-[#D9A66A]">Nome:</strong> {cliente}</li>
                  <li><strong className="text-[#D9A66A]">Telefone:</strong> {telefone}</li>
                </ul>
                <p className="text-xs text-[#E8C8A3] opacity-80">
                  Verifique as informações antes de confirmar. Qualquer ajuste pode ser feito conosco pelo WhatsApp.
                </p>
              </div>
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                feedback.tipo === "sucesso"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}
            >
              {feedback.mensagem}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={voltar}
            disabled={currentStep === 1}
            className="w-full rounded-xl border border-[#2c120e] px-4 py-3 text-sm font-semibold text-[#E8C8A3] transition hover:border-[#D9A66A]/60 hover:text-[#D9A66A] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Voltar
          </button>

          {currentStep < steps.length && (
            <button
              type="button"
              onClick={avancar}
              disabled={!podeAvancar}
              className="w-full rounded-xl border border-[#D9A66A]/60 bg-[#D9A66A] px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(217,166,106,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Próximo
            </button>
          )}

          {currentStep === steps.length && (
            <button
              type="button"
              onClick={confirmarAgendamento}
              disabled={submitting}
              className="w-full rounded-xl border border-[#D9A66A]/60 bg-[#D9A66A] px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(217,166,106,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Enviando..." : "Confirmar agendamento"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
