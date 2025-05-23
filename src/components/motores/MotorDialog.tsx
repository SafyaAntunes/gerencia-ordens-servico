
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveMotor } from "@/services/motorService";
import { toast } from "sonner";
import { Motor } from "@/types/motores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MotorDialogProps {
  motor: Motor | null;
  open: boolean;
  onClose: (shouldRefresh?: boolean) => void;
}

const MotorDialog = ({ motor, open, onClose }: MotorDialogProps) => {
  const [formData, setFormData] = useState<Partial<Motor>>({
    marca: '',
    modelo: '',
    descricao: '',
    familia: '',
    potencia: '',
    cilindros: '',
    disp_cilindros: '',
    valvulas: '',
    combustivel: 'gasolina',
    peso: '',
    cilindrada: '',
    aplicacao: '',
    ativo: true
  });
  
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (motor) {
      setFormData({
        ...motor
      });
    } else {
      setFormData({
        marca: '',
        modelo: '',
        descricao: '',
        familia: '',
        potencia: '',
        cilindros: '',
        disp_cilindros: '',
        valvulas: '',
        combustivel: 'gasolina',
        peso: '',
        cilindrada: '',
        aplicacao: '',
        ativo: true
      });
    }
  }, [motor, open]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async () => {
    if (!formData.marca || !formData.modelo) {
      toast.error('Marca e modelo são campos obrigatórios.');
      return;
    }
    
    try {
      setLoading(true);
      
      if (motor) {
        // Atualização
        await saveMotor({...formData, id: motor.id} as Motor);
        toast.success('Motor atualizado com sucesso!');
      } else {
        // Novo motor
        await saveMotor(formData as Motor);
        toast.success('Motor adicionado com sucesso!');
      }
      
      onClose(true);
    } catch (error) {
      console.error('Erro ao salvar motor:', error);
      toast.error('Ocorreu um erro ao salvar o motor.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangeCombustivel = (value: string) => {
    setFormData(prev => ({
      ...prev,
      combustivel: value as 'gasolina' | 'diesel' | 'flex' | 'etanol' | 'gnv'
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{motor ? 'Editar Motor' : 'Novo Motor'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marca">Marca*</Label>
              <Input
                id="marca"
                name="marca"
                value={formData.marca || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo*</Label>
              <Input
                id="modelo"
                name="modelo"
                value={formData.modelo || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="familia">Família</Label>
            <Input
              id="familia"
              name="familia"
              value={formData.familia || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cilindros">Cilindros</Label>
              <Input
                id="cilindros"
                name="cilindros"
                value={formData.cilindros || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disp_cilindros">Disposição dos Cilindros</Label>
              <Input
                id="disp_cilindros"
                name="disp_cilindros"
                value={formData.disp_cilindros || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="combustivel">Combustível</Label>
              <Select
                value={formData.combustivel || 'gasolina'}
                onValueChange={handleChangeCombustivel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="etanol">Etanol</SelectItem>
                  <SelectItem value="gnv">GNV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="potencia">Potência</Label>
              <Input
                id="potencia"
                name="potencia"
                value={formData.potencia || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valvulas">Válvulas</Label>
              <Input
                id="valvulas"
                name="valvulas"
                value={formData.valvulas || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="peso">Peso</Label>
              <Input
                id="peso"
                name="peso"
                value={formData.peso || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cilindrada">Cilindrada</Label>
              <Input
                id="cilindrada"
                name="cilindrada"
                value={formData.cilindrada || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aplicacao">Aplicação</Label>
            <Input
              id="aplicacao"
              name="aplicacao"
              value={formData.aplicacao || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              value={formData.descricao || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : motor ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MotorDialog;
