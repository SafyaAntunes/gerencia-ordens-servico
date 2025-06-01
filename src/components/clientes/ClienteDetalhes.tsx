
import { Cliente } from "@/types/clientes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Building, Edit, Calendar } from "lucide-react";
import { format, isValid } from "date-fns";

interface ClienteDetalhesProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (cliente: Cliente) => void;
}

export default function ClienteDetalhes({ 
  cliente, 
  isOpen, 
  onClose,
  onEdit
}: ClienteDetalhesProps) {
  if (!cliente) return null;
  
  // Format date if available and valid
  const formattedDate = (() => {
    if (!cliente.dataCriacao) return "N/A";
    
    const dateValue = typeof cliente.dataCriacao === 'string' 
      ? new Date(cliente.dataCriacao) 
      : cliente.dataCriacao;
      
    return isValid(dateValue) 
      ? format(dateValue, "dd/MM/yyyy")
      : "Data inválida";
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Detalhes do Cliente</DialogTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(cliente)}
            className="mt-0"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-medium">
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{cliente.nome}</h3>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informações de Contato</h4>
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.nome}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefone || "Não informado"}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.email || "Não informado"}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Cadastrado em {formattedDate}</span>
              </div>
            </div>
          </div>
          
          {cliente.endereco && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Endereço</h4>
                <p className="text-sm">{typeof cliente.endereco === 'string' ? cliente.endereco : 
                  `${cliente.endereco.rua}, ${cliente.endereco.numero} - ${cliente.endereco.cidade}/${cliente.endereco.estado}`}</p>
              </div>
            </>
          )}
          
          {cliente.observacoes && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
                <p className="text-sm">{cliente.observacoes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
