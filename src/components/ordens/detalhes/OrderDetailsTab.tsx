
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, StatusOS, EtapaOS, Prioridade } from "@/types/ordens";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteMotorInfo } from "./ClienteMotorInfo";
import { useEffect, useState } from "react";
import { Check, Activity } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface OrderDetailsTabProps {
  ordem: OrdemServico;
  onStatusChange: (status: StatusOS) => void;
}

export function OrderDetailsTab({ ordem, onStatusChange }: OrderDetailsTabProps) {
  const [isUpdatingPrioridade, setIsUpdatingPrioridade] = useState(false);

  const handlePrioridadeChange = async (novaPrioridade: Prioridade) => {
    if (isUpdatingPrioridade) return;
    
    setIsUpdatingPrioridade(true);
    try {
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        prioridade: novaPrioridade
      });
      
      toast.success("Prioridade atualizada com sucesso! A ordem foi reorganizada na lista.");
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
      toast.error("Erro ao atualizar prioridade");
    } finally {
      setIsUpdatingPrioridade(false);
    }
  };

  const statusLabels: Record<StatusOS, string> = {
    desmontagem: "Desmontagem",
    inspecao_inicial: "Inspeção Inicial",
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    autorizado: "Autorizado",
    executando_servico: "Executando Serviço",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue"
  };

  const prioridadeLabels: Record<Prioridade, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente"
  };

  const prioridadeColors: Record<Prioridade, string> = {
    baixa: "bg-green-500",
    media: "bg-blue-500", 
    alta: "bg-orange-500",
    urgente: "bg-red-500"
  };

  // Helper function to safely format dates
  const formatDateSafely = (date: any): string => {
    if (!date) return "Data não definida";
    
    try {
      // Handle string dates
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Validate the date is valid before formatting
      if (!isValid(dateObj)) return "Data inválida";
      
      return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, date);
      return "Data inválida";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Ordem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Status atual:</span>
            <Badge variant="outline" className="text-base">
              {statusLabels[ordem.status as StatusOS] || "Não definido"}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Alterar status:</span>
            <Select
              value={ordem.status}
              onValueChange={(value) => onStatusChange(value as StatusOS)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Abertura</p>
              <p className="font-medium">
                {formatDateSafely(ordem.dataAbertura)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
              <p className="font-medium">
                {formatDateSafely(ordem.dataPrevistaEntrega)}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Prioridade atual</p>
            <Badge className={prioridadeColors[ordem.prioridade || 'media']}>
              {prioridadeLabels[ordem.prioridade || 'media']}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium">Alterar prioridade:</span>
            <Select
              value={ordem.prioridade || 'media'}
              onValueChange={(value) => handlePrioridadeChange(value as Prioridade)}
              disabled={isUpdatingPrioridade}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(prioridadeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Cliente e Motor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClienteMotorInfo ordem={ordem} />
        </CardContent>
      </Card>
    </div>
  );
}
