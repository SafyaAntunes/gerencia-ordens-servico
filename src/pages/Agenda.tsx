import { useState } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isToday, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrdemServico } from "@/types/ordens";

interface AgendaProps {
  onLogout: () => void;
}

// Dados de exemplo para a agenda
const ordens: OrdemServico[] = [
  {
    id: "OS-2023-001",
    nome: "Motor Ford Ka 2019",
    cliente: {
      id: "1",
      nome: "Auto Peças Silva",
      telefone: "(11) 98765-4321",
      email: "contato@autopecassilva.com.br",
    },
    dataAbertura: new Date(2023, 4, 15),
    dataPrevistaEntrega: new Date(2023, 4, 30),
    prioridade: "alta",
    servicos: [
      { tipo: "bloco", descricao: "Retífica completa do bloco", concluido: false },
      { tipo: "virabrequim", descricao: "Balanceamento", concluido: false },
    ],
    status: "fabricacao",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 4, 16), finalizado: new Date(2023, 4, 16) },
      inspecao_inicial: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 17), finalizado: new Date(2023, 4, 18) },
      retifica: { concluido: false, funcionarioId: "3", iniciado: new Date(2023, 4, 19) },
    },
    tempoRegistros: [],
  },
  {
    id: "OS-2023-002",
    nome: "Cabeçote Fiat Uno",
    cliente: {
      id: "2",
      nome: "Oficina Mecânica Central",
      telefone: "(11) 3333-4444",
      email: "oficina@central.com.br",
    },
    dataAbertura: new Date(2023, 4, 10),
    dataPrevistaEntrega: new Date(2023, 4, 25),
    prioridade: "media",
    servicos: [
      { tipo: "cabecote", descricao: "Retífica de válvulas", concluido: false },
    ],
    status: "aguardando_aprovacao",
    etapasAndamento: {
      lavagem: { concluido: true, funcionarioId: "1", iniciado: new Date(2023, 4, 11), finalizado: new Date(2023, 4, 11) },
      inspecao_inicial: { concluido: true, funcionarioId: "2", iniciado: new Date(2023, 4, 12), finalizado: new Date(2023, 4, 12) },
    },
    tempoRegistros: [],
  },
];

export default function Agenda({ onLogout }: AgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"diaria" | "semanal" | "mensal">("semanal");

  // Navegar para semana anterior
  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  // Navegar para próxima semana
  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  // Configurar os dias da semana
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = [...Array(7)].map((_, i) => addDays(startDate, i));

  // Função auxiliar para obter ordens previstas para o dia
  const getOrdensForDay = (date: Date) => {
    return ordens.filter(ordem => {
      const entregaDate = new Date(ordem.dataPrevistaEntrega);
      return (
        entregaDate.getDate() === date.getDate() &&
        entregaDate.getMonth() === date.getMonth() &&
        entregaDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie as datas de entregas das ordens de serviço
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={currentView}
              onValueChange={(value) => setCurrentView(value as any)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diaria">Diária</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Ordem
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {format(startDate, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Dias da semana */}
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, index) => (
                <div 
                  key={`header-${index}`} 
                  className="text-center font-medium text-sm p-2"
                >
                  {day}
                </div>
              ))}
              
              {/* Células do calendário */}
              {weekDays.map((day, index) => (
                <div
                  key={`day-${index}`}
                  className={`min-h-[120px] p-2 border rounded-md ${
                    isToday(day) ? "bg-primary/10 border-primary" : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${
                      isToday(day) ? "text-primary" : ""
                    }`}>
                      {format(day, "d", { locale: ptBR })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <PlusCircle className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {getOrdensForDay(day).map((ordem) => (
                      <div
                        key={ordem.id}
                        className="text-xs p-1 rounded bg-secondary/50 hover:bg-secondary cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{ordem.nome}</span>
                          <StatusBadge status={ordem.prioridade} size="sm" />
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {ordem.cliente.nome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
