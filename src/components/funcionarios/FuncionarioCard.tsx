
import { Phone, Mail, Wrench, Shield, Trash, Edit } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Funcionario, permissoesLabels } from "@/types/funcionarios";
import { Separator } from "@/components/ui/separator";

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const tipoServicoLabel = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando"
};

export default function FuncionarioCard({ funcionario, onClick, onEdit, onDelete }: FuncionarioCardProps) {
  // Extrair iniciais do nome para avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
    
  return (
    <Card className="card-hover overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-medium">
          {iniciais}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{funcionario.nome}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            {permissoesLabels[funcionario.nivelPermissao || 'visualizacao']}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{funcionario.telefone}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{funcionario.email}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Especialidades</span>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {funcionario.especialidades.map((especialidade) => (
              <span 
                key={especialidade}
                className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
              >
                {tipoServicoLabel[especialidade]}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 flex justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          funcionario.ativo 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {funcionario.ativo ? "Ativo" : "Inativo"}
        </span>
        
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClick}>
            Ver detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
