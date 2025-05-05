
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EtapaOS, TipoServico } from "@/types/ordens";
import EtapaTimerWrapper from "./EtapaTimerWrapper";
import EtapaConcluirButton from "./EtapaConcluirButton";
import { useFuncionarioSelect } from "../hooks/useFuncionarioSelect";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

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
  onCustomStart
}: EtapaTimerSectionProps) {
  const { funcionario } = useAuth();
  const { 
    funcionariosOptions, 
    funcionarioSelecionadoId, 
    handleFuncionarioChange,
    setFuncionarioSelecionadoId
  } = useFuncionarioSelect();
  
  // Inicializar com o funcionário atual
  useEffect(() => {
    if (funcionario?.id) {
      setFuncionarioSelecionadoId(funcionario.id);
    }
  }, [funcionario, setFuncionarioSelecionadoId]);
  
  const handleTimerFinish = (tempoTotal: number) => {
    onEtapaConcluida(tempoTotal);
  };
  
  return (
    <div className="p-4 border rounded-md mb-4">
      {!isEtapaConcluida && (
        <div className="mb-3">
          <div className="flex items-center text-sm font-medium mb-1">
            <User className="h-4 w-4 mr-1" />
            Responsável
          </div>
          <Select 
            value={funcionarioSelecionadoId} 
            onValueChange={handleFuncionarioChange}
            disabled={isEtapaConcluida}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {funcionariosOptions.map((func) => (
                <SelectItem key={func.id} value={func.id}>
                  {func.nome} {func.id === funcionario?.id ? "(você)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <EtapaTimerWrapper
        ordemId={ordemId}
        funcionarioId={funcionarioSelecionadoId || funcionarioId}
        funcionarioNome={funcionarioNome}
        etapa={etapa}
        tipoServico={tipoServico}
        isEtapaConcluida={isEtapaConcluida}
        onEtapaConcluida={handleTimerFinish}
        onTimerStart={onTimerStart}
        onCustomStart={onCustomStart}
      />
      
      <EtapaConcluirButton 
        isConcluida={isEtapaConcluida} 
        onClick={onMarcarConcluido} 
      />
    </div>
  );
}
