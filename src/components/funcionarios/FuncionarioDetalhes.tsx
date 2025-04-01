
import { Funcionario, permissoesLabels, tipoServicoLabels } from "@/types/funcionarios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Wrench, Shield, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";

interface FuncionarioDetalhesProps {
  funcionario: Funcionario | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (funcionario: Funcionario) => void;
}

export default function FuncionarioDetalhes({ 
  funcionario, 
  isOpen, 
  onClose,
  onEdit
}: FuncionarioDetalhesProps) {
  if (!funcionario) return null;
  
  // Extract initials for avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  
  // Format date if available
  const formattedDate = funcionario.dataCriacao 
    ? format(
        typeof funcionario.dataCriacao === 'string' 
          ? new Date(funcionario.dataCriacao) 
          : funcionario.dataCriacao, 
        "dd/MM/yyyy"
      )
    : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Detalhes do Funcionário</DialogTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(funcionario)}
            className="mt-0"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-medium">
              {iniciais}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{funcionario.nome}</h3>
              
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {permissoesLabels[funcionario.nivelPermissao]}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={funcionario.ativo 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"}
                >
                  {funcionario.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informações de Contato</h4>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{funcionario.telefone || "Não informado"}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{funcionario.email}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Cadastrado em {formattedDate}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">Especialidades</h4>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {funcionario.especialidades.map((especialidade) => (
                <Badge key={especialidade} variant="secondary">
                  {tipoServicoLabels[especialidade as keyof typeof tipoServicoLabels]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
