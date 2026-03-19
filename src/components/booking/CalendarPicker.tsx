"use client"

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  selectedDate: string; // Formato DD/MM/YYYY
  onSelect: (date: string) => void;
}

export function CalendarPicker({ selectedDate, onSelect }: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(new Date()); // Mês que está sendo visualizado
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Lógica para gerar os dias do mês
  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];

    // Espaços vazios para alinhar o primeiro dia da semana
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toLocaleDateString('pt-BR');
      const isSelected = selectedDate === dateStr;
      
      // Regras de Bloqueio (Segurança e UX)
      const isPast = dateObj < today;
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 60);
      const isTooFar = dateObj > maxDate;
      const isDisabled = isPast || isTooFar;

      days.push(
        <button
          key={day}
          disabled={isDisabled}
          onClick={() => onSelect(dateStr)}
          className={cn(
            "h-10 w-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center",
            isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "hover:bg-secondary",
            isDisabled ? "opacity-20 cursor-not-allowed italic" : "text-foreground",
            dateObj.toDateString() === today.toDateString() && !isSelected ? "border border-primary/50 text-primary" : ""
          )}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const nextMonth = () => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)));
  const prevMonth = () => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)));

  return (
    <div className="bg-card border border-border p-6 rounded-[2rem] shadow-xl animate-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase italic tracking-widest text-primary">
          {months[viewDate.getMonth()]} <span className="text-muted-foreground">{viewDate.getFullYear()}</span>
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysShort.map(d => (
          <div key={d} className="h-10 w-10 flex items-center justify-center text-[10px] font-black uppercase text-muted-foreground opacity-50">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}