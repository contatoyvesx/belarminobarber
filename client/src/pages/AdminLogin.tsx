import { useState } from "react";

type Props = {
  onLogin: (token: string) => void;
};

export default function AdminLogin({ onLogin }: Props) {
  const [token, setToken] = useState("");

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f0f0f",
    }}>
      <div style={{
        width: 320,
        padding: 24,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,.15)",
        background: "rgba(255,255,255,.05)",
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>
          Área do Barbeiro
        </h2>

        <input
          type="password"
          placeholder="Senha de acesso"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.2)",
            background: "transparent",
            padding: "0 12px",
            marginBottom: 12,
          }}
        />

        <button
          onClick={() => onLogin(token)}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 10,
            background: "#22c55e",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
