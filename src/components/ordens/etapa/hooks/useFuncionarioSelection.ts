
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getFuncionarios } from "@/services/funcionarioService";
import { Funcionario } from "@/types/funcionarios";
import { useAuth } from "@/hooks/useAuth";
import { EtapaOS, TipoServico } from "@/types/ordens";

interface UseFuncionarioSelectionProps {
  etapaInfo?: {
    funcionarioId?: string;
    funcionarioNome?: string;
    servicoTipo?: TipoServico;
    concluido?: boolean;
    iniciado?: Date;
  };
  funcionarioId?: string;
  funcionarioNome?: string;
}

export function useFuncionarioSelection({
  etapaInfo,
  funcionarioId: initialFuncionarioId,
  funcionarioNome: initialFuncionarioNome
}: UseFuncionarioSelectionProps) {
  const { funcionario } = useAuth();
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Debug log para entender o ciclo de vida
  console.log("useFuncionarioSelection - Render com:", { 
    etapaInfoId: etapaInfo?.funcionarioId,
    initialId: initialFuncionarioId,
    selecionadoId: funcionarioSelecionadoId
  });
  
  // Fetch funcionarios from database once on mount
  useEffect(() => {
    console.log("useFuncionarioSelection - Fetching funcionarios");
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          console.log(`Received ${funcionariosData.length} funcionarios`);
          setFuncionariosOptions(funcionariosData);
          
          // Initial setup of funcionario selection
          if (!isInitialized) {
            setupInitialFuncionario(funcionariosData);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar lista de funcionários");
      }
    };
    
    carregarFuncionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Setup the initial funcionario selection, prioritizing etapaInfo values
  const setupInitialFuncionario = useCallback((funcionariosData: Funcionario[]) => {
    let foundId = "";
    let foundNome = "";
    
    console.log("Setting up initial funcionario with:", { 
      etapaInfo: etapaInfo?.funcionarioId, 
      initialFuncionarioId, 
      currentUserId: funcionario?.id 
    });
    
    // Priority: etapaInfo > initialFuncionarioId > current user
    if (etapaInfo?.funcionarioId) {
      foundId = etapaInfo.funcionarioId;
      foundNome = etapaInfo.funcionarioNome || "";
      
      if (!foundNome) {
        const funcionarioEncontrado = funcionariosData.find(f => f.id === foundId);
        if (funcionarioEncontrado) {
          foundNome = funcionarioEncontrado.nome;
        }
      }
    } else if (initialFuncionarioId) {
      foundId = initialFuncionarioId;
      
      if (initialFuncionarioNome) {
        foundNome = initialFuncionarioNome;
      } else {
        const funcionarioEncontrado = funcionariosData.find(f => f.id === foundId);
        if (funcionarioEncontrado) {
          foundNome = funcionarioEncontrado.nome;
        }
      }
    } else if (funcionario?.id) {
      foundId = funcionario.id;
      foundNome = funcionario.nome || "";
    }
    
    // Check if the funcionario exists in our options
    const funcionarioExiste = foundId ? funcionariosData.some(f => f.id === foundId) : false;
    
    if (foundId && !funcionarioExiste) {
      console.warn(`Funcionário com ID ${foundId} não encontrado na lista.`);
      // Use current user as fallback
      if (funcionario?.id) {
        foundId = funcionario.id;
        foundNome = funcionario.nome || "";
      } else {
        foundId = "";
        foundNome = "";
      }
    }
    
    console.log("Selected funcionario:", { id: foundId, nome: foundNome });
    
    // Set the selected funcionario
    setFuncionarioSelecionadoId(foundId);
    setFuncionarioSelecionadoNome(foundNome);
    setIsInitialized(true);
  }, [etapaInfo, funcionario, initialFuncionarioId, initialFuncionarioNome]);
  
  // Update when etapaInfo changes
  useEffect(() => {
    if (isInitialized && etapaInfo?.funcionarioId && etapaInfo.funcionarioId !== funcionarioSelecionadoId) {
      console.log("Updating funcionario from etapaInfo change:", etapaInfo.funcionarioId);
      setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
      
      if (etapaInfo.funcionarioNome) {
        setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome);
      } else {
        // Find name if not provided
        const funcionarioEncontrado = funcionariosOptions.find(f => f.id === etapaInfo.funcionarioId);
        if (funcionarioEncontrado) {
          setFuncionarioSelecionadoNome(funcionarioEncontrado.nome);
        }
      }
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome, funcionariosOptions, isInitialized, funcionarioSelecionadoId]);
  
  const handleFuncionarioChange = useCallback((value: string) => {
    console.log("handleFuncionarioChange in hook called with:", value);
    if (!value) return;
    
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    if (funcionarioSelecionado) {
      setFuncionarioSelecionadoNome(funcionarioSelecionado.nome);
    } else {
      console.warn("Funcionário não encontrado na lista para o ID:", value);
    }
  }, [funcionariosOptions]);
  
  return {
    funcionariosOptions,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange,
    setFuncionarioSelecionadoId,
    setFuncionarioSelecionadoNome
  };
}
