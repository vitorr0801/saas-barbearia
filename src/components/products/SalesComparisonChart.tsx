 import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 
 const data = [
   { name: "Serviços", value: 12450, fill: "hsl(var(--primary))" },
   { name: "Produtos", value: 3280, fill: "hsl(var(--chart-2))" },
 ];
 
 export function SalesComparisonChart() {
   const formatCurrency = (value: number) => {
     return new Intl.NumberFormat("pt-BR", {
       style: "currency",
       currency: "BRL",
       minimumFractionDigits: 0,
     }).format(value);
   };
 
   const total = data.reduce((sum, item) => sum + item.value, 0);
   const productPercentage = ((data[1].value / total) * 100).toFixed(1);
 
   return (
     <Card className="bg-card border-border">
       <CardHeader className="pb-2">
         <CardTitle className="text-base font-semibold text-foreground">
           Vendas: Produtos vs Serviços
         </CardTitle>
         <p className="text-xs text-muted-foreground">
           Produtos representam {productPercentage}% do faturamento
         </p>
       </CardHeader>
       <CardContent className="pt-0">
         <div className="h-[180px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart
               data={data}
               layout="vertical"
               margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
             >
               <XAxis type="number" hide />
               <YAxis
                 type="category"
                 dataKey="name"
                 axisLine={false}
                 tickLine={false}
                 tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                 width={70}
               />
               <Bar
                 dataKey="value"
                 radius={[0, 6, 6, 0]}
                 barSize={32}
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </div>
 
         {/* Legend */}
         <div className="flex items-center justify-center gap-6 mt-2">
           {data.map((item) => (
             <div key={item.name} className="flex items-center gap-2">
               <div
                 className="w-3 h-3 rounded-sm"
                 style={{ backgroundColor: item.fill }}
               />
               <span className="text-xs text-muted-foreground">{item.name}:</span>
               <span className="text-xs font-semibold text-foreground">
                 {formatCurrency(item.value)}
               </span>
             </div>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 }