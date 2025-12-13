import { useEffect, useMemo, useState } from "react";

import AgendaVisual from "@/components/AgendaVisual";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 py-12 text-slate-100">
      <div className="mx-auto flex h-full max-w-xl items-center justify-center">
        <Card className="w-full border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Área do Barbeiro</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Acesse o painel administrativo com sua senha exclusiva.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="token">
                Senha de acesso
              </label>
              <Input
                id="token"
                type="password"
                placeholder="Digite sua senha"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-11 border-white/10 bg-black/30 text-base"
              />
            </div>

            <Button className="h-11 w-full text-base font-semibold" onClick={() => onLogin(token)}>
              Entrar
            </Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Administração</p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">Agenda do Barbeiro</h1>
            <p className="text-sm text-slate-300">
              Consulte os horários do dia, confirme ou cancele agendamentos com rapidez.
            </p>
          </div>

          <Button variant="outline" className="self-start border-white/20" onClick={logout}>
            Sair
          </Button>
        </header>

        <Card className="border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Filtro de agenda</CardTitle>
            <CardDescription className="text-slate-300">
              Escolha a data e o profissional para visualizar a programação do dia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200" htmlFor="data">
                  Data
                </label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="h-11 border-white/15 bg-black/30 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200" htmlFor="barbeiro">
                  Barbeiro
                </label>
                <select
                  id="barbeiro"
                  value={barbeiroId}
                  onChange={(e) => {
                    setBarbeiroId(e.target.value);
                    setItems([]);
                    localStorage.setItem("belarmino_admin_barbeiro", e.target.value);
                  }}
                  className="h-11 w-full rounded-md border border-white/15 bg-black/30 px-3 text-base font-medium text-slate-100 shadow-inner outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Selecione o barbeiro</option>
                  {barbeiros.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900">
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3">
                <Button
                  className="h-11 w-full sm:w-auto"
                  onClick={carregar}
                  disabled={loading || !barbeiroId}
                >
                  {loading ? "Carregando..." : "Carregar agenda"}
                </Button>
              </div>
            </div>

            {erro && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 shadow-sm">
                {erro}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.06] shadow-xl shadow-black/30 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Agenda do dia</CardTitle>
                <CardDescription className="text-slate-300">
                  Visualize rapidamente os horários ocupados e livres.
                </CardDescription>
              </div>

              {barbeiroId && (
                <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-200">
                  {barbeiros.find((b) => b.id === barbeiroId)?.nome || "Selecionando barbeiro"}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <AgendaVisual
              agendamentos={lista}
              onConfirmar={(id) => atualizarStatus(id, "confirmado")}
              onCancelar={(id) => atualizarStatus(id, "cancelado")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
