
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface EtapaStatusProps {
  status: "concluido" | "em_andamento" | "nao_iniciado";
  funcionarioNome?: string;
}

export default function EtapaStatus({
  status,
  funcionarioNome
}: EtapaStatusProps) {
  return (
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
      
      {status === "concluido" && funcionarioNome && (
        <div className="flex items-center gap-1 ml-2">
          <User className="h-4 w-4" />
          <span className="text-sm">{funcionarioNome}</span>
        </div>
      )}
    </div>
  );
}
