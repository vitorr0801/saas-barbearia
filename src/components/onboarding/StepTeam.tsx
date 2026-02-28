 import { Plus, Trash2, User, Percent } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 
 export interface Barber {
   id: string;
   name: string;
   commission: string;
 }
 
 interface StepTeamProps {
   barbers: Barber[];
   onChange: (barbers: Barber[]) => void;
 }
 
 export function StepTeam({ barbers, onChange }: StepTeamProps) {
   const addBarber = () => {
     onChange([
       ...barbers,
       { id: crypto.randomUUID(), name: "", commission: "50" }
     ]);
   };
 
   const updateBarber = (id: string, field: keyof Barber, value: string) => {
     onChange(barbers.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
   };
 
   const removeBarber = (id: string) => {
     onChange(barbers.filter((b) => b.id !== id));
   };
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div className="text-center mb-8">
         <h2 className="text-2xl font-bold text-foreground mb-2">Sua Equipe & Comissões</h2>
         <p className="text-muted-foreground text-sm">
           Isso ajudará o sistema a calcular seus repasses automaticamente no Dashboard de BI.
         </p>
       </div>
 
       <div className="space-y-3">
         {barbers.map((barber, index) => (
           <Card key={barber.id} className="bg-card border-border animate-scale-in">
             <CardContent className="p-4">
               <div className="flex items-start gap-3">
                 <Avatar className="h-12 w-12 bg-secondary">
                   <AvatarFallback className="bg-secondary text-muted-foreground">
                     <User className="h-5 w-5" />
                   </AvatarFallback>
                 </Avatar>
                 
                 <div className="flex-1 space-y-3">
                   <div className="flex items-center justify-between">
                     <Label className="text-xs text-muted-foreground">Barbeiro {index + 1}</Label>
                     {barbers.length > 1 && (
                       <button
                         onClick={() => removeBarber(barber.id)}
                         className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                     )}
                   </div>
                   
                   <Input
                     placeholder="Nome do barbeiro"
                     value={barber.name}
                     onChange={(e) => updateBarber(barber.id, "name", e.target.value)}
                     className="bg-background border-border"
                   />
                   
                   <div className="flex items-center gap-2">
                     <Percent className="h-4 w-4 text-muted-foreground" />
                     <Input
                       type="number"
                       min="0"
                       max="100"
                       placeholder="50"
                       value={barber.commission}
                       onChange={(e) => updateBarber(barber.id, "commission", e.target.value)}
                       className="bg-background border-border w-24"
                     />
                     <span className="text-xs text-muted-foreground">de comissão</span>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       <Button
         variant="outline"
         onClick={addBarber}
         className="w-full border-dashed border-border hover:border-primary hover:bg-primary/5"
       >
         <Plus className="h-4 w-4 mr-2" />
         Adicionar Barbeiro
       </Button>
     </div>
   );
 }