
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { getStatusPercent } from "./useEtapasProgress";

// Create a ProgressCircle component since it's missing
const ProgressCircle = ({ value }: { value: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        <circle
          className="text-slate-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className="text-blue-500"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <span className="absolute text-xl font-bold">{Math.round(value)}%</span>
    </div>
  );
};

// Export the getStatusLabel function to fix import issues
export const getStatusLabel = (status: string): string => {
  if (status === "orcamento") return "Orçamento";
  if (status === "aguardando_aprovacao") return "Aguardando Aprovação";
  if (status === "autorizado") return "Autorizado";
  if (status === "executando_servico") return "Executando Serviço";
  if (status === "aguardando_peca_cliente") return "Aguardando Peça (Cliente)";
  if (status === "aguardando_peca_interno") return "Aguardando Peça (Interno)";
  if (status === "finalizado") return "Finalizado";
  if (status === "entregue") return "Entregue";
  return status;
};

interface EtapasTrackerProps {
  status: string;
  progressoEtapas?: number;
  etapasAndamento: {
    lavagem?: { concluido: boolean };
    inspecao_inicial?: { concluido: boolean };
    retifica?: { concluido: boolean };
    montagem?: { concluido: boolean };
    dinamometro?: { concluido: boolean };
    inspecao_final?: { concluido: boolean };
  };
  onStatusChange: (status: string) => void;
  onEtapaChange: (etapa: string, concluido: boolean) => void;
}

export const EtapasTracker: React.FC<EtapasTrackerProps> = ({
  status,
  progressoEtapas,
  etapasAndamento,
  onStatusChange,
  onEtapaChange,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();

  const handleStatusClick = (newStatus: string) => {
    onStatusChange(newStatus);
    toast({
      title: "Status atualizado!",
      description: `Status da ordem de serviço alterado para ${getStatusLabel(newStatus)}.`,
    });
  };

  const handleEtapaChange = (etapa: string, concluido: boolean) => {
    onEtapaChange(etapa, concluido);
  };

  const etapas = [
    { nome: "Lavagem", status: etapasAndamento?.lavagem?.concluido, value: "lavagem" },
    { nome: "Inspeção Inicial", status: etapasAndamento?.inspecao_inicial?.concluido, value: "inspecao_inicial" },
    { nome: "Retífica", status: etapasAndamento?.retifica?.concluido, value: "retifica" },
    { nome: "Montagem", status: etapasAndamento?.montagem?.concluido, value: "montagem" },
    { nome: "Dinamômetro", status: etapasAndamento?.dinamometro?.concluido, value: "dinamometro" },
    { nome: "Inspeção Final", status: etapasAndamento?.inspecao_final?.concluido, value: "inspecao_final" },
  ];

  const statusOptions = [
    { label: "Orçamento", value: "orcamento" },
    { label: "Aguardando Aprovação", value: "aguardando_aprovacao" },
    { label: "Autorizado", value: "autorizado" },
    { label: "Executando Serviço", value: "executando_servico" },
    { label: "Aguardando Peça (Cliente)", value: "aguardando_peca_cliente" },
    { label: "Aguardando Peça (Interno)", value: "aguardando_peca_interno" },
    { label: "Finalizado", value: "finalizado" },
    { label: "Entregue", value: "entregue" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Acompanhamento da Ordem de Serviço</CardTitle>
        <CardDescription>
          Visualize e gerencie o progresso da ordem de serviço.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Progresso Geral</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe o status geral da ordem.
            </p>
          </div>
          <ProgressCircle value={getStatusPercent(status)} />
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold">Status</h3>
          <p className="text-sm text-muted-foreground">
            Altere o status da ordem de serviço.
          </p>
          <div className="mt-2 flex gap-2">
            {statusOptions.map((option) => (
              <Badge
                key={option.value}
                variant={status === option.value ? "secondary" : "outline"}
                onClick={() => handleStatusClick(option.value)}
                className="cursor-pointer"
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold">Etapas</h3>
          <p className="text-sm text-muted-foreground">
            Marque as etapas concluídas da ordem de serviço.
          </p>
          <div className="mt-2 grid gap-2">
            {etapas.map((etapa) => (
              <div key={etapa.nome} className="flex items-center justify-between">
                <Label htmlFor={etapa.nome} className="cursor-pointer">
                  {etapa.nome}
                </Label>
                <Checkbox
                  id={etapa.nome}
                  checked={etapa.status === true}
                  onCheckedChange={(checked) => handleEtapaChange(etapa.value, checked === true)}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setIsDrawerOpen(true)}>
          Mostrar Detalhes Avançados
        </Button>
      </CardFooter>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalhes Avançados</DrawerTitle>
            <DrawerDescription>
              Informações detalhadas sobre a ordem de serviço.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Fechar</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
};

export default EtapasTracker;
