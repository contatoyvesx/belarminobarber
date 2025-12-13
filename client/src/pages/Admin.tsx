import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

type Status = "pendente" | "confirmado" | "cancelado";

type Agendamento = {
  id: number;
  cliente: string;
  telefone: string;
  servico: string;
  data: string;
  inicio: string;
  fim: string;
  status: Status;
};

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const hhmm = (t: string) => t?.slice(0, 5);

function badgeStyle(s: Status) {
  if (s === "confirmado") return { background: "#22c55e22", color: "#22c55e" };
  if (s === "cancelado") return { background: "#ef444422", color: "#ef4444" };
  return { background: "#eab30822", color: "#eab308" };
}

/* ================= LOGIN ================= */

function AdminLogin({ onLogin }: { onLogin: (t: string) => void }) {
  const [token, setToken] = useState("");

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 320, padding: 24, borderRadius: 14, border: "1px solid #333" }}>
        <h2 style={{ fontWeight: 900, marginBottom: 14 }}>Área do Barbeiro</h2>
        <input
          type="password"
          placeholder="Senha de acesso"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: "100%", height: 40, marginBottom: 12 }}
        />
        <button
          onClick={() => onLogin(token)}
          style={{ width: "100%", height: 40, fontWeight: 900 }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

/* ================= ADMIN ================= */

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("belarmino_admin_token") || "");
  const [barbeiroId, setBarbeiroId] = useState(localStorage.getItem("belarmino_admin_barbeiro") || "");
  const [data, setData] = useState(hojeISO());

  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function login(t: string) {
    localStorage.setItem("belarmino_admin_token", t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem("belarmino_admin_token");
    setToken("");
  }

  async function carregar() {
    setErro("");
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/admin/agendamentos?data=${data}&barbeiro_id=${barbeiroId}&token=${token}`
      );

      if (r.status === 401) {
        logout();
        return;
      }

      const j = await r.json();
      if (!r.ok) throw new Error(j?.mensagem);

      setItems(j.agendamentos || []);
    } catch (e: any) {
      setErro(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatus(id: number, status: Status) {
    try {
      const r = await fetch(
        `${API}/admin/agendamentos/${id}?token=${token}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (r.status === 401) {
        logout();
        return;
      }

      if (!r.ok) throw new Error();

      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {
      alert("Erro ao atualizar");
    }
  }

  const lista = useMemo(
    () => items.sort((a, b) => (a.inicio > b.inicio ? 1 : -1)),
    [items]
  );

  /* ====== LOGIN GATE ====== */
  if (!token) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Agenda do Barbeiro</h1>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        <input
          placeholder="Barbeiro ID (por enquanto)"
          value={barbeiroId}
          onChange={(e) => {
            setBarbeiroId(e.target.value);
            localStorage.setItem("belarmino_admin_barbeiro", e.target.value);
          }}
        />
        <button onClick={carregar} disabled={loading}>
          {loading ? "Carregando..." : "Carregar"}
        </button>
        <button onClick={logout}>Sair</button>
      </div>

      {erro && <div style={{ color: "red", marginTop: 10 }}>{erro}</div>}

      <table style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Horário</th>
            <th>Cliente</th>
            <th>Serviço</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lista.map((a) => (
            <tr key={a.id}>
              <td>{hhmm(a.inicio)}–{hhmm(a.fim)}</td>
              <td>{a.cliente}</td>
              <td>{a.servico}</td>
              <td>
                <span style={{ padding: "4px 10px", borderRadius: 999, ...badgeStyle(a.status) }}>
                  {a.status}
                </span>
              </td>
              <td>
                <button onClick={() => atualizarStatus(a.id, "confirmado")}>✔</button>
                <button onClick={() => atualizarStatus(a.id, "cancelado")}>✖</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
