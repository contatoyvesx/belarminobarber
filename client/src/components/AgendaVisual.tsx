import React from "react";

type Status = "pendente" | "confirmado" | "cancelado";

type Agendamento = {
  id: number;
  cliente: string;
  telefone: string;
  servico: string;
  inicio: string; // "09:00:00"
  fim: string; // "09:30:00"
  status: Status;
};

type Props = {
  agendamentos: Agendamento[];
  onConfirmar?: (id: number) => void;
  onCancelar?: (id: number) => void;
};

const hhmm = (t: string) => t.slice(0, 5);

function statusColor(status: Status) {
  if (status === "confirmado") return "#22c55e";
  if (status === "cancelado") return "#ef4444";
  return "#eab308"; // pendente
}

function statusBg(status: Status) {
  if (status === "confirmado") return "rgba(34,197,94,.15)";
  if (status === "cancelado") return "rgba(239,68,68,.15)";
  return "rgba(234,179,8,.18)";
}

// Gera slots fixos de 30min (09:00–18:00)
function gerarSlots() {
  const slots: string[] = [];
  for (let h = 9; h < 18; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

export default function AgendaVisual({ agendamentos, onConfirmar, onCancelar }: Props) {
  const slots = gerarSlots();

  const mapa = new Map<string, Agendamento>();
  agendamentos.forEach((a) => {
    mapa.set(hhmm(a.inicio), a);
  });

  return (
    <div
      style={{
        marginTop: 20,
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {slots.map((hora) => {
        const a = mapa.get(hora);

        return (
          <div
            key={hora}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr",
              borderBottom: "1px solid rgba(255,255,255,.08)",
              background: a ? statusBg(a.status) : "rgba(0,0,0,.15)",
              minHeight: 54,
            }}
          >
            {/* HORA */}
            <div
              style={{
                padding: "14px 10px",
                fontWeight: 900,
                opacity: 0.85,
                borderRight: "1px solid rgba(255,255,255,.08)",
              }}
            >
              {hora}
            </div>

            {/* BLOCO */}
            <div style={{ padding: "10px 14px" }}>
              {a ? (
                <div>
                  <div style={{ fontWeight: 900 }}>{a.cliente}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{a.servico}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{a.telefone}</div>

                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                        color: statusColor(a.status),
                        border: `1px solid ${statusColor(a.status)}55`,
                      }}
                    >
                      {a.status}
                    </div>

                    <span style={{ fontSize: 12, opacity: 0.7 }}>{`${hhmm(a.inicio)} - ${hhmm(a.fim)}`}</span>

                    <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                      {onConfirmar && (
                        <button
                          onClick={() => onConfirmar(a.id)}
                          style={{
                            borderRadius: 6,
                            padding: "4px 8px",
                            border: "1px solid #22c55e55",
                            color: "#22c55e",
                            background: "transparent",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Confirmar
                        </button>
                      )}

                      {onCancelar && (
                        <button
                          onClick={() => onCancelar(a.id)}
                          style={{
                            borderRadius: 6,
                            padding: "4px 8px",
                            border: "1px solid #ef444455",
                            color: "#ef4444",
                            background: "transparent",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ opacity: 0.5, fontStyle: "italic" }}>Livre</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
