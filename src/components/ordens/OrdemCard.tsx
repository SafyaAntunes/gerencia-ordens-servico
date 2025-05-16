import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { OrdemServico } from "@/types/ordens";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { getStatusLabel } from "@/components/ordens/etapas-tracker";
import OrderProgress from "./OrderProgress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface OrdemCardProps {
  ordem: OrdemServico;
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onReorder?: (dragIndex: number, dropIndex: number) => void;
  index?: number; // Add index property to fix type error
}

export const OrdemCard: React.FC<OrdemCardProps> = ({
  ordem,
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelect,
  onReorder,
  index
}) => {
  const handleSelect = () => {
    onSelect && onSelect(!isSelected);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Sem data";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Card
      className="cursor-pointer hover:bg-accent"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {isSelectable && (
            <Checkbox
              id={`select-ordem-${ordem.id}`}
              checked={isSelected}
              onCheckedChange={handleSelect}
              aria-label={`Selecionar ordem ${ordem.id}`}
            />
          )}
          <CardTitle className="text-sm font-medium">{ordem.nome}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {ordem.cliente?.nome || "Cliente não especificado"}
        </p>
        <StatusBadge status={ordem.status} />
        <OrderProgress percentComplete={75} />
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-between">
        <div>
          Aberto em: {formatDate(ordem.dataAbertura)}
        </div>
        <div>
          Entrega: {formatDate(ordem.dataPrevistaEntrega)}
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrdemCard;
