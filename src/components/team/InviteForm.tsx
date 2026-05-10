import { useState, useEffect } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteFormProps {
  onInvite: (email: string, job: string, providesServices: boolean) => Promise<void>;
  isLoading: boolean;
}

export function InviteForm({ onInvite, isLoading }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState("Barbeiro");
  const [providesServices, setProvidesServices] = useState(true);

  // Lógica inteligente: Gerentes/Secretárias geralmente não têm agenda
  useEffect(() => {
    setProvidesServices(job === "Barbeiro");
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(email, job, providesServices).then(() => setEmail(""));
  };

  return (
    <section className="dash-card space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <div className="flex items-center gap-2 text-foreground">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-black uppercase tracking-widest">Convidar Colaborador</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">E-mail</Label>
          <Input 
            type="email" 
            placeholder="nome@email.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            disabled={isLoading} 
            className="h-11 rounded-xl bg-secondary/50" 
          />
        </div>
        
        <div className="w-full lg:w-48 space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cargo</Label>
          <Select value={job} onValueChange={setJob}>
            <SelectTrigger className="h-11 rounded-xl bg-secondary/50 border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Barbeiro">Barbeiro</SelectItem>
              <SelectItem value="Gerente">Gerente</SelectItem>
              <SelectItem value="Secretária">Secretária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-3 h-11 px-3 rounded-xl border border-border bg-secondary/20">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Terá agenda?</Label>
          <Switch checked={providesServices} onCheckedChange={setProvidesServices} />
        </div>

        <Button type="submit" disabled={isLoading || !email.includes('@')} className="h-11 w-full lg:w-auto rounded-xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest px-6">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Convite"}
        </Button>
      </form>
    </section>
  );
}