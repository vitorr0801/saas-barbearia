/** Estado passado do agendamento (Index) para o Checkout via `location.state`. */
export type BookingCheckoutState = {
  shopId: string;
  serviceId: string;
  serviceName: string;
  /** Valor numérico para `appointments.total_price` */
  servicePrice: number;
  /** Ex.: "R$ 45,00" para o resumo */
  totalPriceDisplay: string;
  professionalId: string;
  professionalName: string;
  appointmentDate: string;
  dateLabel: string;
  time: string;
};

export function isBookingCheckoutState(value: unknown): value is BookingCheckoutState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.shopId === "string" &&
    typeof v.serviceId === "string" &&
    typeof v.serviceName === "string" &&
    typeof v.servicePrice === "number" &&
    typeof v.totalPriceDisplay === "string" &&
    typeof v.professionalId === "string" &&
    typeof v.professionalName === "string" &&
    typeof v.appointmentDate === "string" &&
    typeof v.dateLabel === "string" &&
    typeof v.time === "string"
  );
}
