import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { day: "Seg", value: 980 },
  { day: "Ter", value: 1250 },
  { day: "Qua", value: 890 },
  { day: "Qui", value: 1450 },
  { day: "Sex", value: 1680 },
  { day: "Sáb", value: 2100 },
  { day: "Dom", value: 450 },
];

export function RevenueChart() {
  return (
    <div className="dash-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-black uppercase italic tracking-tight text-foreground">Visão Semanal</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Faturamento dos últimos 7 dias
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-foreground">R$ 8.800</p>
          <p className="text-xs font-medium text-success">+12% vs semana anterior</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 65%)', fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(217 33% 17%)',
                border: '1px solid hsl(217 33% 25%)',
                borderRadius: '12px',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              formatter={(value: number) => [`R$ ${value}`, 'Faturamento']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(38 92% 50%)"
              strokeWidth={2}
              fill="url(#amberGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
