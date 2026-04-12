import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Endereço de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Endereço de e-mail inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["freelancer", "publisher"], {
    required_error: "Selecione o tipo de conta",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
