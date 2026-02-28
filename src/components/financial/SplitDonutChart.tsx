import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SplitData {
  shopShare: number;
  barberShare: number;
}

interface SplitDonutChartProps {
  data: SplitData;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function SplitDonutChart({ data }: SplitDonutChartProps) {
  const chartData = [
    { name: "Sua Parte", value: data.shopShare, color: "hsl(var(--primary))" },
    { name: "Comissão Barbeiros", value: data.barberShare, color: "hsl(var(--muted-foreground))" },
  ];

  const total = data.shopShare + data.barberShare;
  const shopPercentage = ((data.shopShare / total) * 100).toFixed(0);

  return (
    <Card className="card-premium">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">
          Divisão de Receita do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-xl">
                        <p className="text-sm font-medium text-foreground">
                          {payload[0].name}
                        </p>
                        <p className="text-sm text-primary font-bold">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{shopPercentage}%</p>
              <p className="text-xs text-muted-foreground">Sua Parte</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(item.value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
