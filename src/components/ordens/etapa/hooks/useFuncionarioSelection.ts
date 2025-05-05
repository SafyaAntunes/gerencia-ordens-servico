
import { useState, useEffect } from "react";
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
  
  // Fetch funcionarios from database
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosData = await getFuncionarios();
        if (funcionariosData) {
          setFuncionariosOptions(funcionariosData);
          
          // Atualizar a ordem de prioridade para usar etapaInfo primeiro
          if (etapaInfo?.funcionarioId) {
            setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
            if (etapaInfo.funcionarioNome) {
              setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome);
            } else {
              // Buscar nome do funcionário se não estiver definido
              const funcionarioEncontrado = funcionariosData.find(f => f.id === etapaInfo.funcionarioId);
              if (funcionarioEncontrado) {
                setFuncionarioSelecionadoNome(funcionarioEncontrado.nome);
              }
            }
          } 
          // Se não tiver etapaInfo, usar o funcionarioId do parâmetro
          else if (initialFuncionarioId) {
            setFuncionarioSelecionadoId(initialFuncionarioId);
            if (initialFuncionarioNome) {
              setFuncionarioSelecionadoNome(initialFuncionarioNome);
            } else {
              // Buscar nome do funcionário se não estiver definido
              const funcionarioEncontrado = funcionariosData.find(f => f.id === initialFuncionarioId);
              if (funcionarioEncontrado) {
                setFuncionarioSelecionadoNome(funcionarioEncontrado.nome);
              }
            }
          }
          // Em último caso, usar o funcionário atual
          else if (funcionario?.id) {
            setFuncionarioSelecionadoId(funcionario.id);
            setFuncionarioSelecionadoNome(funcionario.nome || "");
          }
          
          // Verificar se o funcionário salvo existe na lista e logar aviso
          if (etapaInfo?.funcionarioId) {
            const funcionarioExiste = funcionariosData.some(f => f.id === etapaInfo.funcionarioId);
            if (!funcionarioExiste) {
              console.warn(`Funcionário com ID ${etapaInfo.funcionarioId} não encontrado na lista.`);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar lista de funcionários");
      }
    };
    
    carregarFuncionarios();
  }, [etapaInfo, funcionario, initialFuncionarioId, initialFuncionarioNome]);

  // Atualizar o estado quando etapaInfo mudar
  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      console.log("Atualizando funcionário selecionado a partir de etapaInfo:", etapaInfo.funcionarioId, etapaInfo.funcionarioNome);
      setFuncionarioSelecionadoId(etapaInfo.funcionarioId);
      setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome || "");
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome]);
  
  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  return {
    funcionariosOptions,
    funcionarioSelecionadoId,
    funcionarioSelecionadoNome,
    handleFuncionarioChange,
    setFuncionarioSelecionadoId,
    setFuncionarioSelecionadoNome
  };
}
