import { useState } from 'react';
import { Motor } from '@/types/motor';
import { Cliente } from '@/types/clientes';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Car } from 'lucide-react';
import { MotorForm } from './MotorForm';
import { useMotores } from '@/hooks/useMotores';

interface MotorSelectorProps {
  selectedCliente?: Cliente;
  selectedMotorId?: string;
  onMotorSelect: (motorId: string) => void;
  disabled?: boolean;
}

export function MotorSelector({ 
  selectedCliente, 
  selectedMotorId, 
  onMotorSelect, 
  disabled 
}: MotorSelectorProps) {
  const [showNewMotorDialog, setShowNewMotorDialog] = useState(false);
  const { motores, isLoading, saveMotor } = useMotores();

  const handleNewMotor = () => {
    setShowNewMotorDialog(true);
  };

  const handleSaveNewMotor = (motor: Motor) => {
    saveMotor(motor);
    setShowNewMotorDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Carregando motores...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {motores.length === 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Nenhum motor cadastrado no sistema
              </span>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleNewMotor}
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Cadastrar Novo Motor
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Select 
              value={selectedMotorId || ''} 
              onValueChange={onMotorSelect}
              disabled={disabled}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um motor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {motores.map((motor) => (
                  <SelectItem key={motor.id} value={motor.id}>
                    {motor.marca} {motor.modelo} 
                    {motor.ano && ` (${motor.ano})`}
                    {motor.numeroSerie && ` - ${motor.numeroSerie}`}
                    {motor.clienteNome && ` - Cliente: ${motor.clienteNome}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={handleNewMotor}
              disabled={disabled}
              title="Cadastrar novo motor"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <MotorForm
        open={showNewMotorDialog}
        onClose={() => setShowNewMotorDialog(false)}
        onSave={handleSaveNewMotor}
        isLoading={false}
      />
    </>
  );
}