
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChartData = {
  name: string;
  total: number;
};

interface StatusChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  className?: string;
}

export default function StatusChart({ 
  title, 
  description, 
  data,
  className 
}: StatusChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none",
              }}
              formatter={(value: number) => [`${value}`, "Total"]}
              labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
            />
            <Bar 
              dataKey="total" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]} 
              className="animate-slide-in"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
