import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrdemServico, StatusOS } from "@/types/ordens";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteMotorInfo } from "./ClienteMotorInfo";

interface OrderDetailsTabProps {
  ordem: OrdemServico;
  onStatusChange: (status: StatusOS) => void;
}

export function OrderDetailsTab({ ordem, onStatusChange }: OrderDetailsTabProps) {
  const statusLabels: Record<StatusOS, string> = {
    orcamento: "Orçamento",
    aguardando_aprovacao: "Aguardando Aprovação",
    fabricacao: "Fabricação",
    aguardando_peca_cliente: "Aguardando Peça (Cliente)",
    aguardando_peca_interno: "Aguardando Peça (Interno)",
    finalizado: "Finalizado",
    entregue: "Entregue"
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
                {format(new Date(ordem.dataAbertura), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
              <p className="font-medium">
                {format(new Date(ordem.dataPrevistaEntrega), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Prioridade</p>
            <Badge className={
              ordem.prioridade === 'baixa' ? 'bg-green-500' :
              ordem.prioridade === 'media' ? 'bg-blue-500' :
              ordem.prioridade === 'alta' ? 'bg-orange-500' :
              ordem.prioridade === 'urgente' ? 'bg-red-500' : 'bg-gray-500'
            }>
              {ordem.prioridade === 'baixa' && 'Baixa'}
              {ordem.prioridade === 'media' && 'Média'}
              {ordem.prioridade === 'alta' && 'Alta'}
              {ordem.prioridade === 'urgente' && 'Urgente'}
            </Badge>
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
