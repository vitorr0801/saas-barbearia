 import { Upload, Building2 } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Card, CardContent } from "@/components/ui/card";
 
 interface BusinessData {
   name: string;
   address: string;
   openTime: string;
   closeTime: string;
 }
 
 interface StepIdentityProps {
   data: BusinessData;
   onChange: (data: BusinessData) => void;
 }
 
 const timeSlots = [
   "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
   "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
   "20:00", "21:00", "22:00"
 ];
 
 export function StepIdentity({ data, onChange }: StepIdentityProps) {
   return (
     <div className="space-y-6 animate-fade-in">
       <div className="text-center mb-8">
         <h2 className="text-2xl font-bold text-foreground mb-2">Identidade da Barbearia</h2>
         <p className="text-muted-foreground text-sm">
           Vamos começar a profissionalizar sua gestão! ✨
         </p>
       </div>
 
       <div className="space-y-4">
         <div className="space-y-2">
           <Label htmlFor="business-name" className="text-foreground">Nome da Unidade</Label>
           <Input
             id="business-name"
             placeholder="Ex: Barbearia Style Premium"
             value={data.name}
             onChange={(e) => onChange({ ...data, name: e.target.value })}
             className="bg-background border-border focus:ring-primary focus:border-primary"
           />
         </div>
 
         <div className="space-y-2">
           <Label htmlFor="address" className="text-foreground">Endereço</Label>
           <Input
             id="address"
             placeholder="Asa Sul, Brasília - DF"
             value={data.address}
             onChange={(e) => onChange({ ...data, address: e.target.value })}
             className="bg-background border-border focus:ring-primary focus:border-primary"
           />
         </div>
 
         <Card className="bg-card border-border">
           <CardContent className="p-4">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                 <Upload className="h-5 w-5 text-muted-foreground" />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-medium text-foreground">Logo da Barbearia</p>
                 <p className="text-xs text-muted-foreground">PNG ou JPG, máx 2MB</p>
               </div>
               <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
                 Upload
               </button>
             </div>
           </CardContent>
         </Card>
 
         <Card className="bg-card border-border">
           <CardContent className="p-4">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                 <Building2 className="h-5 w-5 text-muted-foreground" />
               </div>
               <div>
                 <p className="text-sm font-medium text-foreground">Horário de Funcionamento</p>
                 <p className="text-xs text-muted-foreground">Segunda a Sábado</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <Label className="text-xs text-muted-foreground">Abertura</Label>
                 <Select value={data.openTime} onValueChange={(v) => onChange({ ...data, openTime: v })}>
                   <SelectTrigger className="bg-background border-border">
                     <SelectValue placeholder="09:00" />
                   </SelectTrigger>
                   <SelectContent>
                     {timeSlots.map((time) => (
                       <SelectItem key={time} value={time}>{time}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="text-xs text-muted-foreground">Fechamento</Label>
                 <Select value={data.closeTime} onValueChange={(v) => onChange({ ...data, closeTime: v })}>
                   <SelectTrigger className="bg-background border-border">
                     <SelectValue placeholder="20:00" />
                   </SelectTrigger>
                   <SelectContent>
                     {timeSlots.map((time) => (
                       <SelectItem key={time} value={time}>{time}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }