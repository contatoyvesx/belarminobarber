import { z } from "zod";

export const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
  }, "Data deve estar no formato YYYY-MM-DD e ser válida.");

export const horaSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .refine((value) => {
    const [hora, minuto] = value.split(":").map(Number);
    return (
      Number.isInteger(hora) &&
      Number.isInteger(minuto) &&
      hora >= 0 &&
      hora < 24 &&
      minuto >= 0 &&
      minuto < 60
    );
  }, "Hora deve estar no formato HH:MM.");

export const barbeiroIdSchema = z.string().uuid({ message: "barbeiro_id inválido." });

export const horariosQuerySchema = z.object({
  data: dataSchema,
  barbeiro_id: barbeiroIdSchema,
});

export const novoAgendamentoSchema = z.object({
  cliente: z.string().trim().min(1, "cliente é obrigatório"),
  telefone: z.string().trim().min(1, "telefone é obrigatório"),
  servico: z.string().trim().min(1, "serviço é obrigatório"),
  data: dataSchema,
  hora: horaSchema,
  barbeiro_id: barbeiroIdSchema,
});
