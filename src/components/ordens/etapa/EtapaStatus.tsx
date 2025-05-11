
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface EtapaStatusProps {
  etapaNome: string; // Add this prop to match the usage in EtapaCard
  status: "concluido" | "em_andamento" | "nao_iniciado";
  isEtapaConcluida: boolean;
  funcionarioNome?: string;
  podeReiniciar: boolean;
  onReiniciar: () => void;
}

export default function EtapaStatus({
  etapaNome,
  status,
  isEtapaConcluida,
  funcionarioNome,
  podeReiniciar,
  onReiniciar
}: EtapaStatusProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        <div className="flex items-center gap-2">
          {status === "concluido" && (
            <Badge variant="success">
              Concluído
            </Badge>
          )}
          {status === "em_andamento" && (
            <Badge variant="outline">Em andamento</Badge>
          )}
          {status === "nao_iniciado" && (
            <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
          )}
        </div>
      </div>
      
      {isEtapaConcluida && funcionarioNome && (
        <div className="mb-4 flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-1" />
          <span>Concluído por: {funcionarioNome}</span>
          
          {podeReiniciar && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={onReiniciar}
            >
              Reiniciar Etapa
            </Button>
          )}
        </div>
      )}
    </>
  );
}
