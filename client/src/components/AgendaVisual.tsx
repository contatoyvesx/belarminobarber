import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pendente" | "confirmado" | "cancelado";

type Agendamento = {
  id: number;
  cliente: string;
  telefone: string;
  servico: string;
  inicio: string; // "09:00:00"
  fim: string;    // "09:30:00"
  status: Status;
};

type Props = {
  agendamentos: Agendamento[];
};

const hhmm = (t: string) => t.slice(0, 5);

const statusStyle: Record<Status, string> = {
  confirmado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  cancelado: "border-red-500/30 bg-red-500/10 text-red-100",
  pendente: "border-amber-400/30 bg-amber-400/10 text-amber-100",
};

// Gera slots fixos de 30min (09:00–18:00)
function gerarSlots() {
  const slots: string[] = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

export default function AgendaVisual({ agendamentos }: Props) {
  const slots = gerarSlots();

  const mapa = new Map<string, Agendamento>();
  agendamentos.forEach((a) => {
    mapa.set(hhmm(a.inicio), a);
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg shadow-black/20">
      {slots.map((hora) => {
        const a = mapa.get(hora);

        return (
          <div
            key={hora}
            className={cn(
              "grid grid-cols-1 border-b border-white/5 last:border-0 sm:grid-cols-[96px_1fr]",
              a ? "bg-white/[0.03]" : "bg-black/10"
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-slate-200 sm:border-b-0 sm:border-r sm:text-base">
              <span>{hora}</span>
              {a && (
                <span className="text-xs font-normal text-slate-400 sm:hidden">{`${hhmm(a.inicio)} - ${hhmm(a.fim)}`}</span>
              )}
            </div>

            <div className="px-4 py-4">
              {a ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-white">{a.cliente}</div>
                    <div className="text-sm text-slate-300">{a.servico}</div>
                    <div className="text-xs text-slate-400">{a.telefone}</div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge className={cn("capitalize", statusStyle[a.status])}>{a.status}</Badge>
                    <span className="text-xs text-slate-400">{`${hhmm(a.inicio)} - ${hhmm(a.fim)}`}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm italic text-slate-400">Horário livre</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
