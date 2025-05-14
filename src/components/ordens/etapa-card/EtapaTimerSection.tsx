
import { Button } from "@/components/ui/button";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useState } from "react";
import useEtapaTimerSection from "@/hooks/useEtapaTimerSection";

interface EtapaTimerSectionProps {
  ordemId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  etapa: EtapaOS;
  tipoServico?: TipoServico;
  isEtapaConcluida: boolean;
  onEtapaConcluida: (tempoTotal: number) => void;
  onMarcarConcluido: () => void;
  onTimerStart: () => boolean;
  onCustomStart: () => boolean;
  onSaveResponsavel: () => Promise<void>;
}

export default function EtapaTimerSection({
  ordemId,
  funcionarioId,
  funcionarioNome,
  etapa,
  tipoServico,
  isEtapaConcluida,
  onEtapaConcluida,
  onMarcarConcluido,
  onTimerStart,
  onCustomStart,
  onSaveResponsavel
}: EtapaTimerSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const { timerProps, concluirButtonProps, saveResponsavelProps } = useEtapaTimerSection({
    ordemId,
    funcionarioId,
    funcionarioNome,
    etapa,
    tipoServico,
    isEtapaConcluida,
    onEtapaConcluida,
    onMarcarConcluido,
    onTimerStart,
    onCustomStart,
    onSaveResponsavel
  });
  
  const handleSaveResponsavel = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await saveResponsavelProps.onSave();
    } finally {
      setIsSaving(false);
    }
  };
  
  // Este componente foi simplificado e é principalmente um wrapper para o useEtapaTimerSection
  return (
    <div className="mb-4">
      {/* Componente de timer seria implementado aqui com timerProps */}
      
      {!isEtapaConcluida && (
        <div className="flex justify-end mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSaveResponsavel}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar Responsável"}
          </Button>
        </div>
      )}
    </div>
  );
}
