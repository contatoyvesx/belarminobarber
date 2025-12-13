import React from "react";

export type Barbeiro = {
  id: string;
  nome: string;
  descricao?: string;
};

interface BarbeiroCardProps {
  barbeiro: Barbeiro;
  selected?: boolean;
  onSelect: (barbeiro: Barbeiro) => void;
}

function getInitials(nome: string) {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "BB";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function BarbeiroCard({ barbeiro, selected, onSelect }: BarbeiroCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(barbeiro)}
      className={`group relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 ${
        selected
          ? "border-[#D9A66A]/80 bg-[#20100d]/80 shadow-[0_0_25px_rgba(217,166,106,0.2)]"
          : "border-[#2c120e] bg-[#150605]/80 hover:border-[#D9A66A]/40 hover:shadow-[0_0_18px_rgba(217,166,106,0.15)]"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold uppercase transition ${
          selected
            ? "bg-[#D9A66A] text-black shadow-[0_0_18px_rgba(217,166,106,0.4)]"
            : "bg-[#2c120e] text-[#E8C8A3] group-hover:text-[#D9A66A]"
        }`}
      >
        {getInitials(barbeiro.nome)}
      </div>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-[#F4E0C9]">
          {barbeiro.nome}
        </span>
        <span className="text-xs uppercase tracking-wide text-[#d1aa74] opacity-80">
          {barbeiro.descricao || "Barbeiro"}
        </span>
      </div>
      {selected && (
        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#D9A66A] shadow-[0_0_10px_rgba(217,166,106,0.6)]" />
      )}
    </button>
  );
}

export default BarbeiroCard;
