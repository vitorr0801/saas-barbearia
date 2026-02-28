 import { Plus, Trash2, Scissors, Clock, DollarSign, Eye } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 
 export interface Service {
   id: string;
   name: string;
   price: string;
   duration: string;
 }
 
 interface StepServicesProps {
   services: Service[];
   onChange: (services: Service[]) => void;
   onPreview: () => void;
 }
 
 export function StepServices({ services, onChange, onPreview }: StepServicesProps) {
   const addService = () => {
     onChange([
       ...services,
       { id: crypto.randomUUID(), name: "", price: "", duration: "30" }
     ]);
   };
 
   const updateService = (id: string, field: keyof Service, value: string) => {
     onChange(services.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
   };
 
   const removeService = (id: string) => {
     onChange(services.filter((s) => s.id !== id));
   };
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div className="text-center mb-8">
         <h2 className="text-2xl font-bold text-foreground mb-2">Catálogo de Serviços</h2>
         <p className="text-muted-foreground text-sm">
           Adicione os serviços que sua barbearia oferece.
         </p>
       </div>
 
       <div className="space-y-3">
         {services.map((service, index) => (
           <Card key={service.id} className="bg-card border-border animate-scale-in">
             <CardContent className="p-4">
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                       <Scissors className="h-4 w-4 text-primary" />
                     </div>
                     <Label className="text-xs text-muted-foreground">Serviço {index + 1}</Label>
                   </div>
                   {services.length > 1 && (
                     <button
                       onClick={() => removeService(service.id)}
                       className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   )}
                 </div>
 
                 <Input
                   placeholder="Nome do serviço (ex: Corte)"
                   value={service.name}
                   onChange={(e) => updateService(service.id, "name", e.target.value)}
                   className="bg-background border-border"
                 />
 
                 <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                     <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                       type="number"
                       placeholder="45,00"
                       value={service.price}
                       onChange={(e) => updateService(service.id, "price", e.target.value)}
                       className="bg-background border-border pl-9"
                     />
                   </div>
                   <div className="relative">
                     <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                       type="number"
                       placeholder="30"
                       value={service.duration}
                       onChange={(e) => updateService(service.id, "duration", e.target.value)}
                       className="bg-background border-border pl-9"
                     />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
 
       <div className="flex gap-3">
         <Button
           variant="outline"
           onClick={addService}
           className="flex-1 border-dashed border-border hover:border-primary hover:bg-primary/5"
         >
           <Plus className="h-4 w-4 mr-2" />
           Adicionar Serviço
         </Button>
         <Button
           variant="secondary"
           onClick={onPreview}
           className="flex-1"
         >
           <Eye className="h-4 w-4 mr-2" />
           Previsualizar Agenda
         </Button>
       </div>
     </div>
   );
 }