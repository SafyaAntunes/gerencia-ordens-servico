
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Funcionario } from "@/types/funcionarios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Mail, Phone, ChevronRight } from "lucide-react";

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onClick: () => void;
  onToggleStatus?: (id: string, ativo: boolean) => void;
}

export default function FuncionarioCard({ 
  funcionario, 
  onClick,
  onToggleStatus
}: FuncionarioCardProps) {
  // Mapeamento para tradução dos tipos de serviço
  const servicoLabels: Record<string, string> = {
    bloco: "Bloco",
    biela: "Biela",
    cabecote: "Cabeçote",
    virabrequim: "Virabrequim",
    eixo_comando: "Eixo de Comando",
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(funcionario.id, !funcionario.ativo);
    }
  };
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
        funcionario.ativo ? "" : "opacity-70"
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{funcionario.nome}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Mail className="h-3.5 w-3.5 mr-1" />
              {funcionario.email}
            </CardDescription>
          </div>
          
          <StatusBadge 
            status={funcionario.ativo ? "ativo" : "inativo"} 
            size="sm" 
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground flex items-center">
              <Phone className="h-3.5 w-3.5 mr-1" />
              {funcionario.telefone}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-1.5">
              {funcionario.especialidades.map((especialidade) => (
                <Badge 
                  key={especialidade} 
                  variant="secondary"
                  className="capitalize"
                >
                  {servicoLabels[especialidade] || especialidade.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            {onToggleStatus && (
              <div 
                className="flex items-center space-x-2" 
                onClick={handleToggleStatus}
              >
                <Switch id={`status-${funcionario.id}`} checked={funcionario.ativo} />
                <label
                  htmlFor={`status-${funcionario.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {funcionario.ativo ? "Ativo" : "Inativo"}
                </label>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Detalhes
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
