
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LabelList,
  Cell
} from "recharts";
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

// Cores para os diferentes status e tipos de serviço
const COLORS = [
  '#8B5CF6', // Vivid Purple
  '#F97316', // Bright Orange
  '#0EA5E9', // Ocean Blue
  '#84cc16', // Lime Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#22c55e'  // Green
];

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
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 20, right: 70, left: 70, bottom: 20 }}
          >
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              tick={{ fontSize: 14 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none",
              }}
              formatter={(value: number) => [`${value}`, "Total"]}
            />
            <Bar 
              dataKey="total" 
              radius={[0, 4, 4, 0]}
              barSize={32}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
              <LabelList 
                dataKey="total" 
                position="right" 
                style={{ 
                  fontSize: '14px',
                  fontWeight: 500,
                  fill: '#333'
                }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
