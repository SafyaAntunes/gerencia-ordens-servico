
import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isToday, isSameDay } from "date-fns";
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
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import OrdemForm from "@/components/ordens/OrdemForm";

interface AgendaProps {
  onLogout: () => void;
}

export default function Agenda({ onLogout }: AgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"diaria" | "semanal" | "mensal">("semanal");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Carregar ordens do localStorage
  useEffect(() => {
    const carregarOrdens = () => {
      const ordensJson = localStorage.getItem("ordens");
      if (ordensJson) {
        try {
          const parsedOrdens = JSON.parse(ordensJson);
          // Converter strings de data para objetos Date
          const ordensFormatadas = parsedOrdens.map((ordem: any) => ({
            ...ordem,
            dataAbertura: new Date(ordem.dataAbertura),
            dataPrevistaEntrega: new Date(ordem.dataPrevistaEntrega),
          }));
          setOrdens(ordensFormatadas);
        } catch (error) {
          console.error("Erro ao carregar ordens:", error);
          setOrdens([]);
        }
      }
    };

    carregarOrdens();
  }, []);

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
      return isSameDay(entregaDate, date);
    });
  };
  
  // Função para navegar para a página de detalhes da ordem
  const handleNavigateToOrdem = (id: string) => {
    console.log(`Navegando para a ordem: ${id}`);
    navigate(`/ordens/${id}`);
  };
  
  // Função para adicionar nova ordem
  const handleCreateOrdem = (values: any) => {
    console.log("Nova ordem de serviço:", values);
    setIsDialogOpen(false);
    // Aqui você adicionaria a nova ordem ao estado ou enviaria para a API
    // E depois atualizaria a lista
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
            <Button onClick={() => setIsDialogOpen(true)}>
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <PlusCircle className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {getOrdensForDay(day).map((ordem) => (
                      <div
                        key={ordem.id}
                        className="text-xs p-1 rounded bg-secondary/50 hover:bg-secondary cursor-pointer"
                        onClick={() => handleNavigateToOrdem(ordem.id)}
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
      
      {/* Dialog para criar nova ordem */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Preencha todos os campos para cadastrar uma nova ordem de serviço.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="p-6 pt-4 max-h-[80vh] overflow-y-auto">
            <OrdemForm onSubmit={handleCreateOrdem} />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
