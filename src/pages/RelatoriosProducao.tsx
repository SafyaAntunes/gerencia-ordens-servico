
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Component for displaying production reports
export default function RelatoriosProducao() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });
  
  const [activeTab, setActiveTab] = useState("funcionarios");

  const handleGenerateReport = () => {
    console.log("Generating report for date range:", dateRange);
    // Here you'd implement the logic to generate and display the report
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Relatórios de Produção</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Defina o período para gerar relatórios de produção.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div>
                <Label htmlFor="date-range">Período</Label>
                <div className="mt-2 border rounded-md p-4">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  {dateRange?.from && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Período selecionado:</span>{" "}
                      {format(dateRange.from, "dd/MM/yyyy")}
                      {dateRange.to && ` - ${format(dateRange.to, "dd/MM/yyyy")}`}
                    </p>
                  )}
                </div>
                <Button onClick={handleGenerateReport}>Gerar Relatório</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="funcionarios" className="flex-1">Funcionários</TabsTrigger>
            <TabsTrigger value="servicos" className="flex-1">Serviços</TabsTrigger>
            <TabsTrigger value="clientes" className="flex-1">Clientes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="funcionarios" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Funcionário</CardTitle>
                <CardDescription>Análise de produtividade por funcionário no período selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Selecione um período para visualizar os dados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servicos" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Serviços</CardTitle>
                <CardDescription>Distribuição de serviços e tempos médios de execução.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Selecione um período para visualizar os dados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clientes" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Visão por Cliente</CardTitle>
                <CardDescription>Ordens de serviço e faturamento por cliente.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center border border-dashed rounded-md">
                  <p className="text-muted-foreground">Selecione um período para visualizar os dados.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
