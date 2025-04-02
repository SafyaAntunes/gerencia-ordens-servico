
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

interface PausaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

export default function PausaDialog({ isOpen, onClose, onConfirm }: PausaDialogProps) {
  const [motivo, setMotivo] = useState("");
  
  const handleConfirm = () => {
    if (!motivo.trim()) {
      return;
    }
    onConfirm(motivo);
    setMotivo("");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo da pausa</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="motivo-pausa">Por favor, informe o motivo da pausa:</Label>
          <Textarea
            id="motivo-pausa"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-2"
            placeholder="Ex: Aguardando peças, Troca de turno, etc."
            required
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!motivo.trim()}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
