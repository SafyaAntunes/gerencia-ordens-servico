
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PausaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

// Lista de motivos de pausa pré-definidos
const motivosPreDefinidos = [
  "Banheiro",
  "Falta de Ferramenta",
  "Manutenção de Equipamento",
  "Falta de Material",
  "Parada Técnica"
];

export default function PausaDialog({ isOpen, onClose, onConfirm }: PausaDialogProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState("");
  const [motivoCustom, setMotivoCustom] = useState("");
  
  const handleConfirm = () => {
    // Se selecionou "Outro" e preencheu motivo custom, usa o custom
    // Senão, usa o pré-definido selecionado
    const motivoFinal = motivoSelecionado === "outro" 
      ? motivoCustom.trim() 
      : motivoSelecionado;
      
    if (!motivoFinal) {
      return;
    }
    
    onConfirm(motivoFinal);
    setMotivoSelecionado("");
    setMotivoCustom("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo da pausa</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label>Selecione o motivo da pausa:</Label>
          <RadioGroup
            value={motivoSelecionado}
            onValueChange={setMotivoSelecionado}
            className="mt-3 space-y-2"
          >
            {motivosPreDefinidos.map((motivo) => (
              <div key={motivo} className="flex items-center space-x-2">
                <RadioGroupItem value={motivo} id={`motivo-${motivo}`} />
                <Label htmlFor={`motivo-${motivo}`} className="cursor-pointer">
                  {motivo}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outro" id="motivo-outro" />
              <Label htmlFor="motivo-outro" className="cursor-pointer">
                Outro
              </Label>
            </div>
          </RadioGroup>
          
          {motivoSelecionado === "outro" && (
            <div className="mt-4">
              <Label htmlFor="motivo-custom">Descreva o motivo:</Label>
              <Textarea
                id="motivo-custom"
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                className="mt-2"
                placeholder="Ex: Aguardando instruções do supervisor"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!motivoSelecionado || (motivoSelecionado === "outro" && !motivoCustom.trim())}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
