
import { Badge } from "@/components/ui/badge";
import { User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EtapaStatusProps {
  status: "concluido" | "em_andamento" | "nao_iniciado";
  funcionarioNome?: string;
  onReiniciar?: () => void;
  podeReiniciar: boolean;
}

export default function EtapaStatus({
  status,
  funcionarioNome,
  onReiniciar,
  podeReiniciar
}: EtapaStatusProps) {
  return (
    <>
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
      
      {status === "concluido" && funcionarioNome && (
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
