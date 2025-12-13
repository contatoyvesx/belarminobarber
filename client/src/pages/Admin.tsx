import { useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Agendamento = {
  id: string;
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  inicio: string;
  fim: string;
  status?: string;
};

export default function Admin() {
  const [data, setData] = useState(hojeISO());
  const [barbeiroId, setBarbeiroId] = useState("");
  const [token, setToken] = useState("");
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const canLoad = useMemo(() => !!(data && barbeiroId && token), [data, barbeiroId, token]);

  async function carregar() {
    setErro("");
    setLoading(true);
    try {
      const url = `${API}/admin/agendamentos?data=${encodeURIComponent(data)}&barbeiro_id=${encodeURIComponent(
        barbeiroId
      )}&token=${encodeURIComponent(token)}`;

      const r = await fetch(url);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.mensagem || "Falha ao carregar");

      setItems(j.agendamentos || []);
    } catch (e: any) {
      setErro(e?.message || "Erro");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatus(id: string, status: "confirmado" | "cancelado") {
    setErro("");
    try {
      const r = await fetch(`${API}/admin/agendamentos/${id}?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.mensagem || "Falha ao atualizar");

      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e: any) {
      setErro(e?.message || "Erro ao atualizar");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin — Agenda do Barbeiro</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr auto", gap: 10, marginTop: 14 }}>
        <input value={data} onChange={(e) => setData(e.target.value)} type="date" />
        <input
          value={barbeiroId}
          onChange={(e) => setBarbeiroId(e.target.value)}
          placeholder="barbeiro_id (UUID)"
        />
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN" />
        <button disabled={!canLoad || loading} onClick={carregar}>
          {loading ? "Carregando..." : "Carregar"}
        </button>
      </div>

      {erro && <div style={{ marginTop: 12, color: "crimson", fontWeight: 700 }}>{erro}</div>}

      <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,.15)", paddingTop: 12 }}>
        {items.length === 0 && !loading ? (
          <div>Nenhum agendamento.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((a) => (
              <div
                key={a.id}
                style={{
                  border: "1px solid rgba(255,255,255,.15)",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "160px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  {a.inicio}–{a.fim}
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{a.status || "pendente"}</div>
                </div>

                <div>
                  <div style={{ fontWeight: 800 }}>{a.cliente}</div>
                  <div style={{ opacity: 0.9 }}>{a.servico}</div>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>{a.telefone}</div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => atualizarStatus(a.id, "confirmado")}>Confirmar</button>
                  <button onClick={() => atualizarStatus(a.id, "cancelado")}>Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
