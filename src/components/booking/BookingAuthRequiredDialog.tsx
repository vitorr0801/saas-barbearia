"use client";

import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MESSAGE =
  "Você precisa de uma conta BarberPro para realizar agendamentos e salvar favoritos.";

type BookingAuthRequiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingAuthRequiredDialog({ open, onOpenChange }: BookingAuthRequiredDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold uppercase tracking-tight">Acesso necessário</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">{MESSAGE}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={() => {
              onOpenChange(false);
            }}
            className="rounded-xl"
          >
            Voltar
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl btn-primary-glow"
            onClick={() => {
              onOpenChange(false);
              navigate("/cadastro?role=cliente");
            }}
          >
            Criar conta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { MESSAGE as BOOKING_AUTH_REQUIRED_MESSAGE };
