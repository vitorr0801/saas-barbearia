"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-background", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6",
        caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label: "text-sm font-black uppercase italic tracking-tighter",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg transition-all"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between w-full mb-4",
        head_cell: "text-muted-foreground/40 rounded-md flex-1 font-black text-[10px] uppercase tracking-[0.2em] text-center",
        row: "flex w-full mt-2 gap-1",
        
        // 🎯 CÉLULA LIMPA: Removemos todos os seletores de "range" e "has" que geravam o quadrado invisível
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        
        // 🎯 SHAPE BASE: Arredondado perfeito para todos os dias
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium transition-all hover:bg-primary/20 hover:text-primary rounded-full"
        ),
        day_range_end: "day-range-end",
        
        // 🎯 SELECIONADO: Cor sólida, sombra brilhante e círculo perfeito
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full shadow-[0_0_15px_rgba(var(--primary),0.4)] font-black scale-110",
        
        // 🎯 HOJE: Apenas contorno
        day_today: "border border-primary/50 text-primary font-black rounded-full",
        
        day_outside: "day-outside text-muted-foreground/10 opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      // 🚀 MODIFICADOR DE AGENDAMENTO: Pontinho inferior alinhado
      modifiersClassNames={{
        booked: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };