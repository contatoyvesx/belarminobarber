import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

type Status = "pendente" | "confirmado" | "cancelado";

type Agendamento = {
  id: number;
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  inicio: string; // "09:00:00"
  fim: string; // "09:30:00"
  status: Status;
};

function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const hhmm = (t: string) => (t?.length >= 5 ? t.slice(0, 5) : t);

function statusLabel(s: Status) {
  if (s === "confirmado") return "Confirmado";
  if (s === "cancelado") return "Cancelado";
  return "Pendente";
}

function badgeStyle(s: Status) {
  // sem frescura: cores claras e legíveis
  if (s === "confirmado")
    return { background: "rgba(34,197,94,.18)", border: "1px solid rgba(34,197,94,.35)", color: "rgba(34,197,94,.95)" };
  if (s === "cancelado")
    return { background: "rgba(239,68,68,.16)", border: "1px solid rgba(239,68,68,.35)", color: "rgba(239,68,68,.95)" };
  return { background: "rgba(234,179,8,.16)", border: "1px solid rgba(234,179,8,.35)", color: "rgba(234,179,8,.95)" };
}

function cardStyle() {
  return {
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 14,
    padding: 14,
    background: "rgba(0,0,0,.15)",
    backdropFilter: "blur(6px)",
  } as const;
}

export default function Admin() {
  const [data, setData] = useState(hojeISO());
  const [barbeiroId, setBarbeiroId] = useState("");
  const [token, setToken] = useState("");

  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | "todos">("todos");

  const [mutatingId, setMutatingId] = useState<number | null>(null);

  // carregar credenciais salvas
  useEffect(() => {
    const savedToken = localStorage.getItem("belarmino_admin_token") || "";
    const savedBarbeiro = localStorage.getItem("belarmino_admin_barbeiro") || "";
    if (savedToken) setToken(savedToken);
    if (savedBarbeiro) setBarbeiroId(savedBarbeiro);
  }, []);

  // salvar credenciais
  useEffect(() => {
    if (token) localStorage.setItem("belarmino_admin_token", token);
  }, [token]);

  useEffect(() => {
    if (barbeiroId) localStorage.setItem("belarmino_admin_barbeiro", barbeiroId);
  }, [barbeiroId]);

  const canLoad = !!(data && barbeiroId && token);

  async function carregar() {
    if (!canLoad) return;
    setErro("");
    setLoading(true);
    try {
      const url =
        `${API}/admin/agendamentos` +
        `?data=${encodeURIComponent(data)}` +
        `&barbeiro_id=${encodeURIComponent(barbeiroId)}` +
        `&token=${encodeURIComponent(token)}`;

      const r = await fetch(url);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.mensagem || "Falha ao carregar");

      setItems((j.agendamentos || []) as Agendamento[]);
    } catch (e: any) {
      setErro(e?.message || "Erro");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatus(id: number, status: "confirmado" | "cancelado") {
    setErro("");
    setMutatingId(id);
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
    } finally {
      setMutatingId(null);
    }
  }

  const resumo = useMemo(() => {
    let pend = 0, conf = 0, canc = 0;
    for (const a of items) {
      if (a.status === "confirmado") conf++;
      else if (a.status === "cancelado") canc++;
      else pend++;
    }
    return { pend, conf, canc, total: items.length };
  }, [items]);

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((a) => (filter === "todos" ? true : a.status === filter))
      .filter((a) => {
        if (!q) return true;
        const blob = `${a.cliente} ${a.telefone} ${a.servico} ${a.inicio} ${a.fim}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => (a.inicio > b.inicio ? 1 : -1));
  }, [items, search, filter]);

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: -0.5 }}>Admin — Agenda</div>
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            Visual simples, rápido e sem confusão.
          </div>
        </div>

        <button
          onClick={carregar}
          disabled={!canLoad || loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.06)",
            cursor: !canLoad || loading ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* CONTROLES */}
      <div style={{ ...cardStyle(), marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 10 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Data</div>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{
                height: 40,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(0,0,0,.2)",
                padding: "0 10px",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Barbeiro ID</div>
            <input
              value={barbeiroId}
              onChange={(e) => setBarbeiroId(e.target.value)}
              placeholder="UUID do barbeiro"
              style={{
                height: 40,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(0,0,0,.2)",
                padding: "0 10px",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>ADMIN_TOKEN</div>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token do admin"
              style={{
                height: 40,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(0,0,0,.2)",
                padding: "0 10px",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10, marginTop: 12 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone, serviço..."
            style={{
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.18)",
              background: "rgba(0,0,0,.2)",
              padding: "0 10px",
            }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              height: 40,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.18)",
              background: "rgba(0,0,0,.2)",
              padding: "0 10px",
            }}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="confirmado">Confirmados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {erro && <div style={{ marginTop: 10, color: "rgba(239,68,68,.95)", fontWeight: 900 }}>{erro}</div>}
      </div>

      {/* RESUMO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
        <div style={cardStyle()}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Total</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{resumo.total}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Pendentes</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{resumo.pend}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Confirmados</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{resumo.conf}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Cancelados</div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{resumo.canc}</div>
        </div>
      </div>

      {/* LISTA */}
      <div style={{ ...cardStyle(), marginTop: 12, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,.12)", fontWeight: 950 }}>
          Agendamentos ({lista.length})
        </div>

        {lista.length === 0 ? (
          <div style={{ padding: 14, opacity: 0.8 }}>Nenhum agendamento nesse filtro.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.75 }}>
                  <th style={{ padding: "12px 14px" }}>Horário</th>
                  <th style={{ padding: "12px 14px" }}>Cliente</th>
                  <th style={{ padding: "12px 14px" }}>Serviço</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {lista.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid rgba(255,255,255,.10)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 950 }}>
                      {hhmm(a.inicio)}–{hhmm(a.fim)}
                      <div style={{ fontSize: 12, opacity: 0.7 }}>#{a.id}</div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 950 }}>{a.cliente}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{a.telefone}</div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>{a.servico}</td>

                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, fontWeight: 900, ...badgeStyle(a.status) }}>
                        {statusLabel(a.status)}
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          onClick={() => atualizarStatus(a.id, "confirmado")}
                          disabled={mutatingId === a.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,.18)",
                            background: "rgba(34,197,94,.12)",
                            cursor: mutatingId === a.id ? "not-allowed" : "pointer",
                            fontWeight: 900,
                          }}
                        >
                          Confirmar
                        </button>

                        <button
                          onClick={() => atualizarStatus(a.id, "cancelado")}
                          disabled={mutatingId === a.id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,.18)",
                            background: "rgba(239,68,68,.10)",
                            cursor: mutatingId === a.id ? "not-allowed" : "pointer",
                            fontWeight: 900,
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
