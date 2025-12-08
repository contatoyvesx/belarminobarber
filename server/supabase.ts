import { createClient } from "@supabase/supabase-js";

const missingEnv: string[] = [];

if (!process.env.SUPABASE_URL) missingEnv.push("SUPABASE_URL");
if (!process.env.SUPABASE_KEY) missingEnv.push("SUPABASE_KEY");

if (missingEnv.length) {
  const hint =
    "Defina as variáveis de ambiente acima no arquivo .env do servidor (SUPABASE_URL e SUPABASE_KEY) para que o backend consiga se conectar ao banco.";
  throw new Error(`Variáveis de ambiente ausentes: ${missingEnv.join(", ")}. ${hint}`);
}

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
);
