import { useState } from "react";

export default function Agendar() {
  const [data, setData] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHora, setSelectedHora] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [servico, setServico] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const BARBEIRO_ID = "be3c5248-746f-44ed-8b3c-73ca71a40703"; // <-- o certo

  const API_URL = "https://api-belarmino.yvesx.com.br";

  async function buscarHorarios() {
    if (!data) {
      setMensagemErro("Selecione uma data.");
      return;
    }

    setLoading(true);
    setMensagemErro("");

    try {
      const res = await fetch(
        `${API_URL}/horarios?data=${data}&barbeiro_id=${BARBEIRO_ID}`
      );
      const json = await res.json();

      if (json.horarios) {
        setHorarios(json.horarios);
      } else {
        setHorarios([]);
      }
    } catch (e) {
      setMensagemErro("Erro ao buscar horários.");
    }

    setLoading(false);
  }

  async function confirmarAgendamento() {
    if (!cliente || !telefone || !servico || !selectedHora) {
      setMensagemErro("Preencha todos os campos.");
      return;
    }

    setMensagemErro("");

    const payload = {
      cliente,
      telefone,
      servico,
      data,
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
        const resumo = `Novo agendamento confirmado:\n\n🧔 Cliente: ${cliente}\n📅 Data: ${data}\n⏰ Hora: ${selectedHora}\n💈 Serviço: ${servico}`;

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
        <div>
          <label className="block mb-2 text-[#D9A66A]">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full p-3 rounded bg-[#1b0402] border border-[#6e2317]"
          />
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

          <input
            type="text"
            placeholder="Serviço desejado"
            value={servico}
            onChange={(e) => setServico(e.target.value)}
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
