import { Phone, Mail, Wrench, Shield, Trash, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Funcionario, permissoesLabels, tipoServicoLabels } from "@/types/funcionarios";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onView: (funcionario: Funcionario) => void;
  onEdit: (funcionario: Funcionario) => void;
  onDelete: (id: string) => void;
}

export default function FuncionarioCard({ funcionario, onView, onEdit, onDelete }: FuncionarioCardProps) {
  // Extract initials for the avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
    
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-border h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-medium">
            {iniciais}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">{funcionario.nome}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {permissoesLabels[funcionario.nivelPermissao || 'visualizacao']}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 flex-1">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{funcionario.telefone || "Não informado"}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{funcionario.email || "Não informado"}</span>
          </div>
        
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Especialidades</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {funcionario.especialidades.map((especialidade) => (
                <Badge 
                  key={especialidade}
                  variant="secondary"
                  className="text-xs"
                >
                  {tipoServicoLabels[especialidade as keyof typeof tipoServicoLabels]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 flex justify-between">
        <Badge
          className={funcionario.ativo 
            ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" 
            : "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"}
        >
          {funcionario.ativo ? "Ativo" : "Inativo"}
        </Badge>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(funcionario)}>
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={() => onDelete(funcionario.id)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onView(funcionario)}>
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
