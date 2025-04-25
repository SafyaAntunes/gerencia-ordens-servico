import { Cliente } from "@/types/clientes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, Building, Edit, Calendar, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  // Find the selected motor if there's a motorId in the cliente object
  const selectedMotor = cliente.motores?.find(motor => 
    motor.id === cliente.selectedMotorId
  );

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
              
              <div className="flex items-center gap-2 mt-2">
                {cliente.motores && cliente.motores.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {cliente.motores.length} {cliente.motores.length === 1 ? 'motor' : 'motores'}
                  </Badge>
                )}
              </div>
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
          
          {cliente.observacoes && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
                <p className="text-sm">{cliente.observacoes}</p>
              </div>
            </>
          )}
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Motores</h4>
            
            {selectedMotor ? (
              <div className="border border-border rounded-md p-3">
                <div className="flex justify-between">
                  <h5 className="font-medium">{selectedMotor.marca} {selectedMotor.modelo}</h5>
                  {selectedMotor.ano && <span className="text-sm text-muted-foreground">Ano: {selectedMotor.ano}</span>}
                </div>
                
                {selectedMotor.cilindrada && (
                  <p className="text-sm">
                    Cilindrada: <span className="font-medium">{selectedMotor.cilindrada}</span>
                  </p>
                )}
                
                {selectedMotor.combustivel && (
                  <Badge variant="outline" className="mt-2">
                    {selectedMotor.combustivel.charAt(0).toUpperCase() + selectedMotor.combustivel.slice(1)}
                  </Badge>
                )}
              </div>
            ) : cliente.motores && cliente.motores.length > 0 ? (
              <div className="grid gap-3">
                {cliente.motores.map(motor => (
                  <div key={motor.id} className="border border-border rounded-md p-3">
                    <div className="flex justify-between">
                      <h5 className="font-medium">{motor.marca} {motor.modelo}</h5>
                      {motor.ano && <span className="text-sm text-muted-foreground">Ano: {motor.ano}</span>}
                    </div>
                    
                    {motor.cilindrada && (
                      <p className="text-sm">
                        Cilindrada: <span className="font-medium">{motor.cilindrada}</span>
                      </p>
                    )}
                    
                    {motor.combustivel && (
                      <Badge variant="outline" className="mt-2">
                        {motor.combustivel.charAt(0).toUpperCase() + motor.combustivel.slice(1)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum motor cadastrado para este cliente.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
