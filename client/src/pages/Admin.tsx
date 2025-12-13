import { useEffect, useMemo, useState } from "react";
import AgendaVisual from "@/components/AgendaVisual";

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

type Barbeiro = {
  id: string;
  nome: string;
};

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* ================= LOGIN ================= */

function AdminLogin({ onLogin }: { onLogin: (t: string) => void }) {
  const [token, setToken] = useState("");

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 320, padding: 24, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginBottom: 12 }}>Área do Barbeiro</h2>
        <input
          type="password"
          placeholder="Senha de acesso"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: "100%", height: 40, marginBottom: 10 }}
        />
        <button
          style={{ width: "100%", height: 40, fontWeight: 700 }}
          onClick={() => onLogin(token)}
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

  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  /* ===== AUTH ===== */

  function login(t: string) {
    localStorage.setItem("belarmino_admin_token", t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem("belarmino_admin_token");
    localStorage.removeItem("belarmino_admin_barbeiro");
    setToken("");
    setBarbeiroId("");
    setItems([]);
  }

  /* ===== LOAD BARBEIROS ===== */

  useEffect(() => {
    if (!token) return;

    fetch(`${API}/admin/barbeiros?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => setBarbeiros(j.barbeiros || []))
      .catch(() => setErro("Erro ao carregar barbeiros"));
  }, [token]);

  /* ===== LOAD AGENDA ===== */

  async function carregar() {
    if (!barbeiroId) return;

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
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  /* ===== UPDATE STATUS ===== */

  async function atualizarStatus(id: number, status: Status) {
    try {
      const r = await fetch(`${API}/admin/agendamentos/${id}?token=${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (r.status === 401) {
        logout();
        return;
      }

      if (!r.ok) throw new Error();

      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {
      alert("Erro ao atualizar status");
    }
  }

  const lista = useMemo(
    () => [...items].sort((a, b) => (a.inicio > b.inicio ? 1 : -1)),
    [items]
  );

  /* ===== LOGIN GATE ===== */

  if (!token) {
    return <AdminLogin onLogin={login} />;
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Agenda do Barbeiro</h1>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

        <select
          value={barbeiroId}
          onChange={(e) => {
            setBarbeiroId(e.target.value);
            setItems([]);
            localStorage.setItem("belarmino_admin_barbeiro", e.target.value);
          }}
        >
          <option value="">Selecione o barbeiro</option>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>

        <button onClick={carregar} disabled={loading}>
          {loading ? "Carregando..." : "Carregar"}
        </button>

        <button onClick={logout}>Sair</button>
      </div>

      {erro && <div style={{ color: "red", marginTop: 10 }}>{erro}</div>}

      <AgendaVisual
        agendamentos={lista}
        onConfirmar={(id) => atualizarStatus(id, "confirmado")}
        onCancelar={(id) => atualizarStatus(id, "cancelado")}
      />
    </div>
  );
}
