
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Funcionario } from "@/types/funcionarios";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { toast } from "sonner";

export function useEtapaCard(etapa: EtapaOS, servicoTipo?: TipoServico) {
  const [isAtivo, setIsAtivo] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [progresso, setProgresso] = useState(0);
  const { funcionario } = useAuth();
  
  const podeAtribuirFuncionario = funcionario?.nivelPermissao === 'admin' || 
                                 funcionario?.nivelPermissao === 'gerente';
  
  const podeTrabalharNaEtapa = () => {
    if (funcionario?.nivelPermissao === 'admin' || 
        funcionario?.nivelPermissao === 'gerente') {
      return true;
    }
    
    if (etapa === 'lavagem') {
      return funcionario?.especialidades?.includes('lavagem');
    }
    
    if (etapa === 'inspecao_inicial' || etapa === 'inspecao_final') {
      if (servicoTipo) {
        return funcionario?.especialidades?.includes(servicoTipo);
      }
      return false;
    }
    
    if (servicoTipo) {
      return funcionario?.especialidades?.includes(servicoTipo);
    }
    
    return funcionario?.especialidades?.includes(etapa);
  };
  
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosRef = collection(db, "funcionarios");
        const snapshot = await getDocs(funcionariosRef);
        const funcionarios: Funcionario[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Funcionario;
          funcionarios.push({
            ...data,
            id: doc.id
          });
        });
        
        setFuncionariosOptions(funcionarios);
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };
    
    carregarFuncionarios();
  }, []);
  
  const handleIniciarTimer = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para iniciar uma etapa");
      return;
    }

    // Directly start the timer without dialog
    handleTimerStart();
  };
  
  const handleTimerStart = () => {
    setIsAtivo(true);
    return true; // Indicate success
  };
  
  const handleMarcarConcluido = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return;
    }

    // Just return true to let caller know this was successful
    return true;
  };
  
  const isEtapaConcluida = (etapaInfo: any) => {
    if ((etapa === "inspecao_inicial" || etapa === "inspecao_final") && servicoTipo) {
      return etapaInfo?.concluido && etapaInfo?.servicoTipo === servicoTipo;
    }
    return etapaInfo?.concluido;
  };
  
  const getEtapaStatus = (etapaInfo: any) => {
    if (isEtapaConcluida(etapaInfo)) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  const handleReiniciarEtapa = (onEtapaStatusChange: any) => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para reiniciar uma etapa");
      return;
    }
    
    if (!podeAtribuirFuncionario && !podeTrabalharNaEtapa()) {
      toast.error("Você não tem permissão para reiniciar esta etapa");
      return;
    }
    
    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        false,
        funcionario.id, 
        funcionario.nome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
      
      toast.success("Etapa reaberta para continuação");
    }
  };
  
  return {
    isAtivo,
    setIsAtivo,
    progresso,
    setProgresso,
    funcionariosOptions,
    podeAtribuirFuncionario,
    podeTrabalharNaEtapa,
    handleIniciarTimer,
    handleTimerStart,
    handleMarcarConcluido,
    isEtapaConcluida,
    getEtapaStatus,
    handleReiniciarEtapa
  };
}
