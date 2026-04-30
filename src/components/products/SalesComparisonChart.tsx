import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/currency";
import { useProducts } from "@/hooks/useProducts";

export function SalesComparisonChart() {
  const { currentUser } = useAuth();

  // 1. Busca o total financeiro dos SERVIÇOS (Filtra apenas os concluídos)
  const { data: servicesTotal = 0 } = useQuery({
    queryKey: ["appointments-total", currentUser?.barbearia_id],
    queryFn: async () => {
      if (!currentUser?.barbearia_id) return 0;
      const { data, error } = await supabase
        .from("appointments")
        .select("total_price")
        .eq("barbearia_id", currentUser.barbearia_id)
        .eq("status", "concluido"); // Garante que só soma serviços pagos
      
      if (error) throw error;
      return data.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    },
    enabled: !!currentUser?.barbearia_id,
  });

  // 2. Busca a lista de PRODUTOS (Agora usando o hook centralizado e seguro)
  const { data: products = [] } = useProducts();

  // 3. Busca a lista de VENDAS (Puxa do cache da tela instantaneamente)
  const { data: sales = [] } = useQuery({
    queryKey: ["sales", currentUser?.barbearia_id],
    queryFn: async () => {
      if (!currentUser?.barbearia_id) return [];
      const { data, error } = await supabase
        .from("sales")
        .select("product_id")
        .eq("barbearia_id", currentUser.barbearia_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.barbearia_id,
  });

  // A MÁGICA: Calcula o total cruzando as vendas com o preço dos produtos no cache
  const productsTotal = sales.reduce((acc, sale) => {
    const productInfo = products.find((p) => p.id === sale.product_id);
    return acc + (productInfo ? Number(productInfo.price) : 0);
  }, 0);

  const total = servicesTotal + productsTotal;
  const productPercentage = total > 0 ? ((productsTotal / total) * 100).toFixed(1) : "0.0";

  const data = [
    { name: "Serviços", value: servicesTotal, fill: "hsl(var(--primary))" },
    { name: "Produtos", value: productsTotal, fill: "#10b981" }, // Verde Esmeralda
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Vendas: Produtos vs Serviços
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Produtos representam {productPercentage}% do faturamento global
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

        {/* Legenda */}
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