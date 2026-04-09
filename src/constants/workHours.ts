/**
 * Ordem de exibição: Domingo primeiro (dom), depois Seg–Sáb.
 * Mesmas chaves no UPSERT/DELETE e na coluna `day` do Supabase.
 */
export const WORK_DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;
export type WorkDayKey = (typeof WORK_DAY_KEYS)[number];

export const WORK_DAY_LABELS: Record<WorkDayKey, string> = {
  dom: "Domingo",
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
};
