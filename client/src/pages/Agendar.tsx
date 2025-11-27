import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { cn } from "@/lib/utils";

const formatDateForInput = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offsetMs);

  return localDate.toISOString().split("T")[0];
};

const gerarProximosDias = (quantidade: number) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return Array.from({ length: quantidade }, (_, index) => {
    const data = new Date(hoje);
    data.setDate(data.getDate() + index);

    return {
      valor: formatDateForInput(data),
      label: data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      semana: data.toLocaleDateString("pt-BR", { weekday: "short" }),
      completo: data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  });
};

export default function Agendar() {
  const [dataSelecionada, setDataSelecionada] = useState(() =>
    formatDateForInput(new Date())
  );
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHora, setSelectedHora] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [mensagemErro, setMensagemErro] = useState("");

  const BARBEIRO_ID = "be3c5248-746f-44ed-8b3c-73ca71a40703";
  const API_URL = "https://api-belarmino.yvesx.com.br";

  const servicos = useMemo(
    () => [
      "Corte de cabelo",
      "Barba",
      "Sobrancelha",
      "Hidratação capilar",
      "Limpeza de pele / black mask",
      "Camuflagem de fios brancos",
    ],
    []
  );

  const toggleServico = (servico: string) => {
    setServicosSelecionados((prev) => {
      if (prev.includes(servico)) {
        return prev.filter((item) => item !== servico);
      }
      return [...prev, servico];
    });
    setMensagemErro("");
  };

  const diasDisponiveis = useMemo(() => gerarProximosDias(15), []);

  const dataFormatadaApi = useMemo(() => {
    if (!dataSelecionada) return "";
    return dataSelecionada;
  }, [dataSelecionada]);

  const dataFormatadaDisplay = useMemo(() => {
    const dataEscolhida = diasDisponiveis.find(
      (dia) => dia.valor === dataSelecionada
    );

    if (!dataEscolhida) return "Selecione a data";

    return dataEscolhida.completo;
  }, [dataSelecionada, diasDisponiveis]);

  const servicosFormatados = servicosSelecionados.join(", ");

  async function buscarHorarios() {
    if (!dataSelecionada) {
      setMensagemErro("Selecione uma data.");
      return;
    }

    setLoading(true);
    setMensagemErro("");
    setSelectedHora("");
    setHorarios([]);

    try {
      const res = await fetch(
        `${API_URL}/horarios?data=${dataFormatadaApi}&barbeiro_id=${BARBEIRO_ID}`
      );
      const json = await res.json();

      if (json.horarios) {
        setHorarios(json.horarios);
      } else {
        setHorarios([]);
      }
    } catch {
      setMensagemErro("Erro ao buscar horários.");
    }

    setLoading(false);
  }

  async function confirmarAgendamento() {
    if (
      !cliente ||
      !telefone ||
      !dataSelecionada ||
      !servicosSelecionados.length ||
      !selectedHora
    ) {
      setMensagemErro("Preencha todos os campos.");
      return;
    }

    setMensagemErro("");

    const payload = {
      cliente,
      telefone,
      servico: servicosFormatados,
      data: dataFormatadaApi,
      hora: selectedHora,
      barbeiro_id: BARBEIRO_ID,
    };

    try {
      const res = await fetch(`${API_URL}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.status === "confirmado") {
        const resumo = `Novo agendamento confirmado:\n\n🧔 Cliente: ${cliente}\n📅 Data: ${dataFormatadaDisplay}\n⏰ Hora: ${selectedHora}\n💈 Serviço: ${servicosFormatados}`;

        window.open(
          `https://wa.me/5511952861321?text=${encodeURIComponent(resumo)}`,
          "_blank"
        );
      } else {
        setMensagemErro(json.mensagem || "Erro ao confirmar.");
      }
    } catch {
      setMensagemErro("Erro ao enviar agendamento.");
    }
  }

  return (
    <div className="min-h-screen bg-[#140000] text-white p-4">
      <div className="max-w-xl mx-auto space-y-6">

        <h1 className="text-4xl font-bold text-center text-[#D9A66A]">
          Agendar Horário
        </h1>

        {/* Data */}
        <div className="space-y-3">
          <label className="block text-[#D9A66A]">Data</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {diasDisponiveis.map((dia) => {
              const selecionado = dia.valor === dataSelecionada;

              return (
                <button
                  key={dia.valor}
                  type="button"
                  onClick={() => {
                    setDataSelecionada(dia.valor);
                    setMensagemErro("");
                    setHorarios([]);
                    setSelectedHora("");
                  }}
                  className={cn(
                    "flex flex-col items-start rounded border px-3 py-2 text-left transition",
                    selecionado
                      ? "border-[#D9A66A] bg-[#26100d] text-[#D9A66A]"
                      : "border-[#6e2317] bg-[#1b0402] text-[#E8C8A3] hover:border-[#D9A66A]/60"
                  )}
                >
                  <span className="text-sm uppercase tracking-wide text-[#D9A66A]">
                    {dia.semana}
                  </span>
                  <span className="text-lg font-semibold">{dia.label}</span>
                </button>
              );
            })}
          </div>
          <div className="text-sm text-[#E8C8A3]">{dataFormatadaDisplay}</div>
        </div>

        {/* Buscar horários */}
        <button
          onClick={buscarHorarios}
          className="btn-retro w-full cursor-pointer"
        >
          {loading ? "Buscando..." : "Buscar horários"}
        </button>

        {/* Horários */}
        {horarios.length > 0 && (
          <div className="space-y-2">
            <p className="text-[#D9A66A] font-semibold">Horários disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {horarios.map((h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHora(h)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedHora === h
                      ? "bg-[#D9A66A] text-black"
                      : "bg-[#1b0402] border-[#6e2317] text-[#E8C8A3]"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Serviços */}
        <div className="space-y-3">
          <p className="text-[#D9A66A] font-semibold">Serviços</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {servicos.map((servico) => {
              const selecionado = servicosSelecionados.includes(servico);

              return (
                <label
                  key={servico}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition",
                    selecionado
                      ? "border-[#D9A66A] bg-[#26100d]"
                      : "border-[#6e2317] bg-[#1b0402]"
                  )}
                >
                  <Checkbox
                    checked={selecionado}
                    onCheckedChange={() => toggleServico(servico)}
                    className="border-[#6e2317] data-[state=checked]:border-[#D9A66A] data-[state=checked]:bg-[#D9A66A]"
                  />
                  <span className="text-[#E8C8A3]">{servico}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Dados do cliente */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Seu nome"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
          />

          <input
            type="text"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
          />
        </div>

        {/* Erro */}
        {mensagemErro && (
          <p className="text-red-400 text-center">{mensagemErro}</p>
        )}

        {/* Confirmar */}
        <button
          onClick={confirmarAgendamento}
          className="btn-retro w-full cursor-pointer"
        >
          Confirmar Agendamento
        </button>
      </div>
    </div>
  );
}
