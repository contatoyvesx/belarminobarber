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

const statusLabel = (status: Status) => status.charAt(0).toUpperCase() + status.slice(1);

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
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 16,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(15,23,42,.85), rgba(15,23,42,.5))",
        boxShadow: "0 10px 30px rgba(0,0,0,.32)",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,.12)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,255,255,.04)",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 99,
            background: "#38bdf8",
            boxShadow: "0 0 0 4px rgba(56,189,248,.2)",
          }}
        />
        <div style={{ fontWeight: 900, letterSpacing: 0.3 }}>Agenda do dia</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Horários de 09h às 18h — confirme ou cancele direto na linha.
        </div>
      </div>

      {slots.map((hora) => {
        const a = mapa.get(hora);

        return (
          <div
            key={hora}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              background: a ? statusBg(a.status) : "rgba(255,255,255,.02)",
              minHeight: 64,
              position: "relative",
              paddingLeft: 6,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderLeft: `4px solid ${statusColor(a?.status ?? "pendente")}`,
                opacity: a ? 1 : 0.35,
              }}
            />

            {/* HORA */}
            <div
              style={{
                padding: "16px 14px",
                fontWeight: 900,
                opacity: 0.9,
                borderRight: "1px solid rgba(255,255,255,.08)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 13, letterSpacing: 0.5, opacity: 0.7 }}>Horário</span>
              <span style={{ fontSize: 18 }}>{hora}</span>
            </div>

            {/* BLOCO */}
            <div
              style={{
                padding: "12px 16px",
                position: "relative",
                zIndex: 1,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              {a ? (
                <>
                  <div
                    style={{
                      background: "rgba(255,255,255,.04)",
                      padding: "10px 12px",
                      borderRadius: 12,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{a.cliente}</div>
                    <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{a.servico}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{a.telefone}</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 260,
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        color: statusColor(a.status),
                        background: `${statusBg(a.status)}`,
                        border: `1px solid ${statusColor(a.status)}33`,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: statusColor(a.status),
                        }}
                      />
                      {statusLabel(a.status)}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.9,
                        padding: "6px 10px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,.03)",
                        border: "1px dashed rgba(255,255,255,.08)",
                      }}
                    >
                      {`${hhmm(a.inicio)} – ${hhmm(a.fim)}`}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      {onConfirmar && (
                        <button
                          onClick={() => onConfirmar(a.id)}
                          style={{
                            borderRadius: 8,
                            padding: "6px 12px",
                            border: "1px solid #22c55e55",
                            color: "#22c55e",
                            background: "rgba(34,197,94,.08)",
                            fontWeight: 800,
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
                            borderRadius: 8,
                            padding: "6px 12px",
                            border: "1px solid #ef444455",
                            color: "#ef4444",
                            background: "rgba(239,68,68,.08)",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "rgba(255,255,255,.6)",
                    fontStyle: "italic",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: "1px dashed rgba(255,255,255,.18)",
                      display: "grid",
                      placeItems: "center",
                      opacity: 0.8,
                    }}
                  >
                    📅
                  </div>
                  Livre para agendar
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
