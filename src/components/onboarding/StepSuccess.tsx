import { CheckCircle2, LayoutDashboard, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
 
 export function StepSuccess() {
   const navigate = useNavigate();
 
   return (
     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
       {/* Celebration effect */}
       <div className="relative mb-8">
         <div className="absolute -inset-8 bg-primary/20 rounded-full blur-2xl animate-pulse" />
         <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
           <CheckCircle2 className="h-12 w-12 text-primary-foreground" />
         </div>
         
         {/* Sparkles decoration */}
         <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-bounce" />
         <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-primary/70 animate-bounce delay-150" />
       </div>
 
       <h2 className="text-3xl font-bold text-foreground mb-3">Tudo Pronto! 🎉</h2>
       <p className="text-muted-foreground mb-8 max-w-xs">
         Sua barbearia está configurada e pronta para receber clientes.
       </p>
 
       <div className="w-full max-w-xs space-y-3">
         <Button
           size="lg"
           onClick={() => navigate("/dashboard")}
           className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
         >
           <LayoutDashboard className="h-5 w-5 mr-2" />
           Ir para o meu Dashboard de BI
         </Button>
         
         <Button
           variant="outline"
           size="lg"
          onClick={() => navigate("/agendamentos")}
           className="w-full border-border hover:bg-secondary"
         >
           <Calendar className="h-5 w-5 mr-2" />
           Ver agenda de hoje
         </Button>
       </div>
     </div>
   );
 }