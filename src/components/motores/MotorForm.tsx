
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Motor } from '@/types/motor';

interface MotorFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (motor: Motor) => void;
  motor?: Motor;
  isLoading?: boolean;
}

const EMPTY_MOTOR: Motor = {
  id: '',
  marca: '',
  modelo: '',
  numeroCilindros: undefined,
  combustivel: undefined,
  numeroSerie: '',
  cilindrada: '',
  ano: '',
  observacoes: '',
};

const COMBUSTIVEIS = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'flex', label: 'Flex' },
  { value: 'etanol', label: 'Etanol' },
  { value: 'gnv', label: 'GNV' },
];

export function MotorForm({ open, onClose, onSave, motor, isLoading }: MotorFormProps) {
  const [formData, setFormData] = useState<Motor>(EMPTY_MOTOR);

  // Reset form when motor changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData(motor ? { ...motor } : { ...EMPTY_MOTOR });
    }
  }, [motor, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: value === '' ? undefined : parseInt(value, 10) 
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {motor?.id ? 'Editar Motor' : 'Novo Motor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroCilindros">Quantidade de Cilindros</Label>
                <Input
                  id="numeroCilindros"
                  name="numeroCilindros"
                  type="number"
                  value={formData.numeroCilindros || ''}
                  onChange={handleNumberChange}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="combustivel">Combustível</Label>
                <Select 
                  name="combustivel"
                  value={formData.combustivel || ''}
                  onValueChange={(value) => handleSelectChange(value, 'combustivel')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o combustível" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMBUSTIVEIS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cilindrada">Cilindrada</Label>
                <Input
                  id="cilindrada"
                  name="cilindrada"
                  value={formData.cilindrada || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  name="ano"
                  value={formData.ano || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">Número de Série</Label>
              <Input
                id="numeroSerie"
                name="numeroSerie"
                value={formData.numeroSerie || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes || ''}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
