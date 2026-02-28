import { useState, useEffect } from "react";
import { User, Scissors, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CurrentAppointmentProps {
  clientName: string;
  serviceName: string;
  startTime: Date;
  onFinish: () => void;
}

export function CurrentAppointmentCard({
  clientName,
  serviceName,
  startTime,
  onFinish,
}: CurrentAppointmentProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => {
      onFinish();
      setIsFinishing(false);
    }, 1500);
  };

  if (isFinishing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Atendimento Concluído!
        </h2>
        <p className="text-muted-foreground">Carregando próximo cliente...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Header Label */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm font-medium text-success uppercase tracking-wider">
          Atendimento Atual
        </span>
      </div>

      {/* Client Info */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {clientName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Scissors className="w-4 h-4 text-primary" />
              <span className="text-lg text-muted-foreground">{serviceName}</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="mt-8 p-6 rounded-2xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground uppercase tracking-wider">
                Tempo decorrido
              </span>
            </div>
            <span
              className={cn(
                "text-4xl md:text-5xl font-mono font-bold",
                elapsedSeconds > 2700 ? "text-destructive" : "text-foreground"
              )}
            >
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Finish Button */}
      <Button
        onClick={handleFinish}
        className="w-full h-16 md:h-20 text-xl font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
      >
        <CheckCircle className="w-6 h-6 mr-3" />
        Finalizar Atendimento
      </Button>
    </div>
  );
}
