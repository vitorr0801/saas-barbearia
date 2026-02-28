 import { Package, AlertTriangle, TrendingUp } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 
 interface StatCardProps {
   title: string;
   value: string;
   icon: React.ReactNode;
   iconBg: string;
   subtitle?: string;
 }
 
 function StatCard({ title, value, icon, iconBg, subtitle }: StatCardProps) {
   return (
     <Card className="bg-card border-border">
       <CardContent className="p-4">
         <div className="flex items-start justify-between">
           <div className="space-y-1">
             <p className="text-xs text-muted-foreground font-medium">{title}</p>
             <p className="text-2xl font-bold text-foreground">{value}</p>
             {subtitle && (
               <p className="text-xs text-muted-foreground">{subtitle}</p>
             )}
           </div>
           <div className={`p-2.5 rounded-lg ${iconBg}`}>
             {icon}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }
 
 export function InventoryStats() {
   return (
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
       <StatCard
         title="Total em Estoque"
         value="R$ 4.850,00"
         icon={<Package className="h-5 w-5 text-primary" />}
         iconBg="bg-primary/20"
         subtitle="32 produtos"
       />
       <StatCard
         title="Estoque Baixo"
         value="5"
         icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
         iconBg="bg-destructive/20"
         subtitle="Precisam reposição"
       />
       <StatCard
         title="Mais Vendido"
         value="Pomada Matte"
         icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
         iconBg="bg-emerald-500/20"
         subtitle="23 vendas este mês"
       />
     </div>
   );
 }