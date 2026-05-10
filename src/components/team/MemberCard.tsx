import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock, Scissors, UserMinus, Percent, Save, Loader2, CalendarHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMemberExtended {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  is_admin: boolean;
  job_title: string;
  provides_services: boolean;
  commission_rate: number;
}

interface MemberCardProps {
  member: TeamMemberExtended;
  isSelf: boolean;
  onUpdateCommission: (id: string, rate: number) => void;
  onToggleAgenda: (id: string, current: boolean) => void;
  onRemove: (member: TeamMemberExtended) => void;
  onOpenHours: (id: string, name: string) => void;
  onOpenServices: (id: string, name: string) => void;
}

export function MemberCard({ member, isSelf, onUpdateCommission, onToggleAgenda, onRemove, onOpenHours, onOpenServices }: MemberCardProps) {
  const [rate, setRate] = useState(member.commission_rate.toString());
  const isOwner = member.is_admin;
  const hasChanges = parseFloat(rate) !== member.commission_rate;

  return (
    <li className="dash-card flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:border-primary/20 transition-all group">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-foreground text-lg tracking-tight">{member.name || member.email.split('@')[0]}</p>
          {isOwner && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Dono</Badge>}
          <Badge variant="secondary" className="text-[9px]">{member.job_title}</Badge>
          {isSelf && <Badge className="text-[9px] bg-emerald-500/10 text-emerald-500 border-none">Você</Badge>}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
        
        <div className="flex items-center gap-4 mt-3">
          <Badge className={cn("text-[9px] font-black uppercase border", 
            member.status === 'pendente' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          )}>
            {member.status === 'pendente' ? "Pendente" : "Ativo"}
          </Badge>

          <div className="flex items-center gap-2">
            <Switch 
              checked={member.provides_services} 
              onCheckedChange={() => onToggleAgenda(member.id, member.provides_services)} 
              className="scale-75"
            />
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <CalendarHeart className="h-3 w-3" /> Agenda
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 border-t xl:border-t-0 xl:border-l border-border/50 pt-4 xl:pt-0 xl:pl-6">
        {member.provides_services && (
          <>
            {!isOwner && (
              <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-2xl border border-border/50">
                <div className="flex flex-col px-2">
                  <span className="text-[9px] font-black uppercase text-muted-foreground mb-1">Comissão</span>
                  <div className="relative flex items-center">
                    <Percent className="absolute left-2 h-3 w-3 text-muted-foreground" />
                    <Input 
                      type="number" 
                      value={rate} 
                      onChange={(e) => setRate(e.target.value)} 
                      className="h-7 w-20 pl-6 text-xs font-bold rounded-lg border-none bg-transparent" 
                    />
                  </div>
                </div>
                <Button 
                  size="icon" 
                  disabled={!hasChanges} 
                  onClick={() => onUpdateCommission(member.id, parseFloat(rate))}
                  className={cn("h-8 w-8 rounded-xl transition-all", hasChanges ? "bg-emerald-500" : "bg-muted")}
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>
            )}

            <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => onOpenHours(member.id, member.name)}>
              <Clock className="h-4 w-4 mr-2 text-primary" /> Horários
            </Button>
            <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => onOpenServices(member.id, member.name)}>
              <Scissors className="h-4 w-4 mr-2 text-primary" /> Serviços
            </Button>
          </>
        )}

        {!isOwner && !isSelf && (
          <Button variant="outline" size="sm" className="h-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => onRemove(member)}>
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );
}