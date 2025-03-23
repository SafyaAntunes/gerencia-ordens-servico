
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Funcionario } from "@/types/funcionarios";
import { Phone, Mail, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FuncionarioDetalhesProps {
  funcionario: Funcionario | null;
  isOpen: boolean;
  onClose: () => void;
}

const tipoServicoLabel: Record<string, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando"
};

export default function FuncionarioDetalhes({ 
  funcionario, 
  isOpen, 
  onClose 
}: FuncionarioDetalhesProps) {
  if (!funcionario) return null;
  
  // Extrair iniciais do nome para avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Funcionário</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-medium">
              {iniciais}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{funcionario.nome}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                funcionario.ativo 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {funcionario.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informações de Contato</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{funcionario.telefone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{funcionario.email}</span>
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
                  {tipoServicoLabel[especialidade]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
