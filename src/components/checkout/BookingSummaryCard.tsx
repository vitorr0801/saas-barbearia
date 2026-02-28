import { Calendar, Clock } from "lucide-react";

interface BookingSummaryCardProps {
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  totalPrice: string;
}

export function BookingSummaryCard({
  serviceName,
  professionalName,
  date,
  time,
  totalPrice,
}: BookingSummaryCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-foreground text-lg">{serviceName}</h2>
          <p className="text-sm text-muted-foreground">com {professionalName}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-primary">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary mt-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{time}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{totalPrice}</span>
        </div>
      </div>
    </div>
  );
}
