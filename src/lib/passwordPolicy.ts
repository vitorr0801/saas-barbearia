/** Caracteres especiais aceitos (alinhado ao fluxo de convite / cadastro). */
export const PASSWORD_SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

export type PasswordRequirement = { label: string; test: (pw: string) => boolean };

/** Requisitos exibidos no checklist (Signup, convite / atualizar senha). */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "Mínimo de 8 caracteres", test: (pw) => pw.length >= 8 && pw.length <= 72 },
  { label: "Uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Um número", test: (pw) => /[0-9]/.test(pw) },
  { label: "Um caractere especial", test: (pw) => PASSWORD_SPECIAL_RE.test(pw) },
];

export function isPasswordSecure(pw: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(pw));
}
