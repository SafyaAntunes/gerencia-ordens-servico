
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, RefreshCw } from "lucide-react";

interface EtapaHeaderProps {
  etapaNome: string;
  status: "concluido" | "em_andamento" | "nao_iniciado";
  isEtapaConcluida: boolean;
  funcionarioNome?: string;
  podeReiniciar: boolean;
  onReiniciar: () => void;
}

export default function EtapaHeader({
  etapaNome,
  status,
  isEtapaConcluida,
  funcionarioNome,
  podeReiniciar,
  onReiniciar
}: EtapaHeaderProps) {
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
              className="ml-auto text-blue-500 hover:text-blue-700"
              onClick={onReiniciar}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reiniciar
            </Button>
          )}
        </div>
      )}
    </>
  );
}
