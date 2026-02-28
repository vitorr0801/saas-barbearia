import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (id: string) => void;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect }: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.id}
          onClick={() => slot.available && onSelect(slot.id)}
          disabled={!slot.available}
          className={cn(
            "time-slot",
            selectedSlot === slot.id && "time-slot-selected",
            !slot.available && "opacity-40 cursor-not-allowed line-through"
          )}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}
