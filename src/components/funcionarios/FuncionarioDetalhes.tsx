
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Funcionario } from "@/types/funcionarios";
import { Phone, Mail, Wrench, Edit, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface FuncionarioDetalhesProps {
  funcionario: Funcionario | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (funcionario: Funcionario) => void;
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
  onClose,
  onSave
}: FuncionarioDetalhesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFuncionario, setEditedFuncionario] = useState<Funcionario | null>(null);
  const { toast } = useToast();
  
  // Reset editing state when dialog closes or new funcionario is loaded
  useState(() => {
    if (funcionario) {
      setEditedFuncionario(funcionario);
      setIsEditing(false);
    }
  });
  
  if (!funcionario) return null;
  
  // Extrair iniciais do nome para avatar
  const iniciais = funcionario.nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  
  const handleEditToggle = () => {
    if (isEditing && editedFuncionario) {
      // Save changes
      if (onSave) {
        onSave(editedFuncionario);
        toast({
          title: "Funcionário atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      }
    }
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (field: keyof Funcionario, value: any) => {
    if (editedFuncionario) {
      setEditedFuncionario({
        ...editedFuncionario,
        [field]: value
      });
    }
  };
  
  const handleEspecialidadeChange = (tipo: string, checked: boolean) => {
    if (editedFuncionario) {
      const especialidades = checked
        ? [...editedFuncionario.especialidades, tipo as any]
        : editedFuncionario.especialidades.filter(e => e !== tipo);
      
      setEditedFuncionario({
        ...editedFuncionario,
        especialidades
      });
    }
  };
  
  const displayFuncionario = isEditing ? editedFuncionario : funcionario;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Detalhes do Funcionário</span>
            <Button 
              variant={isEditing ? "default" : "outline"} 
              size="sm" 
              onClick={handleEditToggle}
            >
              {isEditing ? (
                <><Save className="h-4 w-4 mr-1" /> Salvar</>
              ) : (
                <><Edit className="h-4 w-4 mr-1" /> Editar</>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-medium">
              {iniciais}
            </div>
            <div>
              {isEditing ? (
                <Input 
                  value={displayFuncionario?.nome || ''} 
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="font-semibold mb-2"
                />
              ) : (
                <h3 className="text-xl font-semibold">{displayFuncionario?.nome}</h3>
              )}
              
              {isEditing ? (
                <div className="flex items-center gap-2 mt-1">
                  <span>Ativo</span>
                  <Checkbox 
                    checked={displayFuncionario?.ativo}
                    onCheckedChange={(checked) => handleInputChange('ativo', checked)}
                  />
                </div>
              ) : (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                  displayFuncionario?.ativo 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {displayFuncionario?.ativo ? "Ativo" : "Inativo"}
                </span>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informações de Contato</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input 
                    value={displayFuncionario?.telefone || ''}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                ) : (
                  <span>{displayFuncionario?.telefone}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input 
                    value={displayFuncionario?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <span>{displayFuncionario?.email}</span>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">Especialidades</h4>
            </div>
            
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(tipoServicoLabel).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox 
                      id={`especialidade-${key}`}
                      checked={displayFuncionario?.especialidades.includes(key as any)}
                      onCheckedChange={(checked) => 
                        handleEspecialidadeChange(key, checked as boolean)
                      }
                    />
                    <label 
                      htmlFor={`especialidade-${key}`}
                      className="text-sm cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayFuncionario?.especialidades.map((especialidade) => (
                  <Badge key={especialidade} variant="secondary">
                    {tipoServicoLabel[especialidade]}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
