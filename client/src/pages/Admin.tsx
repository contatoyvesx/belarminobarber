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

type Barbeiro = {
  id: string;
  nome: string;
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

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("belarmino_admin_token") || "");
  const [barbeiroId, setBarbeiroId] = useState(localStorage.getItem("belarmino_admin_barbeiro") || "");
  const [data, setData] = useState(hojeISO());
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (token && !barbeiroId) {
      // Fetching the list of barbers when admin logs in
      fetch(`${API}/admin/barbeiros?token=${encodeURIComponent(token)}`)
        .then((res) => res.json())
        .then((data) => setBarbeiros(data.barbeiros))
        .catch(() => setErro("Falha ao carregar barbeiros."));
    }
  }, [token, barbeiroId]);

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
            localStorage.setItem("belarmino_admin_barbeiro", e.target.value);
          }}
        >
          <option value="">Selecione o barbeiro</option>
          {barbeiros.map((barbeiro) => (
            <option key={barbeiro.id} value={barbeiro.id}>
              {barbeiro.nome}
            </option>
          ))}
        </select>
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
