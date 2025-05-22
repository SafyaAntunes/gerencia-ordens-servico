
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Motor } from "@/types/motores";
import { useMotores } from "@/hooks/useMotores";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Cylinder, Fuel, Weight } from "lucide-react";

interface MotorDialogProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  motor: Motor | null;
}

const MotorDialog = ({ open, onClose, motor }: MotorDialogProps) => {
  const { saveMotor } = useMotores();
  
  const [form, setForm] = useState<Partial<Motor>>({
    id: "",
    marca: "",
    modelo: "",
    descricao: "",
    familia: "",
    potencia: "",
    cilindros: "",
    disp_cilindros: "",
    valvulas: "",
    combustivel: "diesel",
    peso: "",
    cilindrada: "",
    aplicacao: "",
    ativo: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (motor) {
      setForm({
        ...motor,
      });
    } else {
      setForm({
        id: "",
        marca: "",
        modelo: "",
        descricao: "",
        familia: "",
        potencia: "",
        cilindros: "",
        disp_cilindros: "",
        valvulas: "",
        combustivel: "diesel",
        peso: "",
        cilindrada: "",
        aplicacao: "",
        ativo: true,
      });
    }
  }, [motor, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.marca || !form.modelo) {
      toast.error("Marca e modelo são obrigatórios.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await saveMotor(form as Motor);
      toast.success(`Motor ${motor ? 'atualizado' : 'criado'} com sucesso!`);
      onClose(true);
    } catch (error) {
      console.error("Erro ao salvar motor:", error);
      toast.error("Erro ao salvar motor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{motor ? 'Editar' : 'Novo'} Motor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <fieldset className="border rounded p-3">
            <legend className="text-sm font-medium px-1">Dados do motor</legend>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="marca" className="text-right">Marca:</Label>
                <div className="relative flex items-center">
                  <Input 
                    id="marca"
                    name="marca"
                    value={form.marca}
                    onChange={handleChange}
                    className="pr-8"
                  />
                  <Search className="absolute right-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="modelo">Modelo:</Label>
                <Input 
                  id="modelo"
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="descricao">Descrição:</Label>
                <Input 
                  id="descricao"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="familia">Família:</Label>
                <div className="relative flex items-center">
                  <Input 
                    id="familia"
                    name="familia"
                    value={form.familia}
                    onChange={handleChange}
                    className="pr-8"
                  />
                  <Search className="absolute right-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <Label htmlFor="potencia">Potência:</Label>
                <Input 
                  id="potencia"
                  name="potencia"
                  value={form.potencia}
                  onChange={handleChange}
                  placeholder="CV"
                />
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="cilindros">Quantidade de Cilindros:</Label>
                <div className="relative flex items-center">
                  <Input 
                    id="cilindros"
                    name="cilindros"
                    value={form.cilindros}
                    onChange={handleChange}
                    type="number"
                    className="pr-8"
                  />
                  <Cylinder className="absolute right-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="disp_cilindros">Disposição dos Cilindros:</Label>
                <Input 
                  id="disp_cilindros"
                  name="disp_cilindros"
                  value={form.disp_cilindros}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="valvulas">Quantidade de Válvulas:</Label>
                <Input 
                  id="valvulas"
                  name="valvulas"
                  value={form.valvulas}
                  onChange={handleChange}
                  type="number"
                />
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="combustivel">Combustível:</Label>
                <div className="relative flex items-center">
                  <Select
                    value={form.combustivel}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, combustivel: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasolina">Gasolina</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="etanol">Etanol</SelectItem>
                      <SelectItem value="gnv">GNV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Fuel className="absolute right-8 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="peso">Peso:</Label>
                <div className="relative flex items-center">
                  <Input 
                    id="peso"
                    name="peso"
                    value={form.peso}
                    onChange={handleChange}
                    placeholder="kg"
                    className="pr-8"
                  />
                  <Weight className="absolute right-2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="cilindrada">Cilindrada:</Label>
                <Input 
                  id="cilindrada"
                  name="cilindrada"
                  value={form.cilindrada}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="aplicacao">Aplicação:</Label>
                <Input 
                  id="aplicacao"
                  name="aplicacao"
                  value={form.aplicacao}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox 
                  id="ativo" 
                  checked={form.ativo}
                  onCheckedChange={(checked) => 
                    setForm((prev) => ({ ...prev, ativo: !!checked }))
                  }
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MotorDialog;
