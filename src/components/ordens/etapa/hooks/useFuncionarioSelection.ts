
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
          
          // Variáveis temporárias para rastrear se encontramos ID e nome
          let foundId = "";
          let foundNome = "";
          
          // Atualizar a ordem de prioridade para usar etapaInfo primeiro
          if (etapaInfo?.funcionarioId) {
            foundId = etapaInfo.funcionarioId;
            
            if (etapaInfo.funcionarioNome) {
              foundNome = etapaInfo.funcionarioNome;
            } else {
              // Buscar nome do funcionário se não estiver definido
              const funcionarioEncontrado = funcionariosData.find(f => f.id === foundId);
              if (funcionarioEncontrado) {
                foundNome = funcionarioEncontrado.nome;
              }
            }
          } 
          // Se não tiver etapaInfo, usar o funcionarioId do parâmetro
          else if (initialFuncionarioId) {
            foundId = initialFuncionarioId;
            
            if (initialFuncionarioNome) {
              foundNome = initialFuncionarioNome;
            } else {
              // Buscar nome do funcionário se não estiver definido
              const funcionarioEncontrado = funcionariosData.find(f => f.id === foundId);
              if (funcionarioEncontrado) {
                foundNome = funcionarioEncontrado.nome;
              }
            }
          }
          // Em último caso, usar o funcionário atual
          else if (funcionario?.id) {
            foundId = funcionario.id;
            foundNome = funcionario.nome || "";
          }
          
          // Garantir que o funcionário exista na lista
          const funcionarioExiste = foundId ? funcionariosData.some(f => f.id === foundId) : false;
          
          if (foundId && !funcionarioExiste) {
            console.warn(`Funcionário com ID ${foundId} não encontrado na lista. Usando atual.`);
            // Usar o funcionário atual como fallback
            if (funcionario?.id) {
              foundId = funcionario.id;
              foundNome = funcionario.nome || "";
            }
          }
          
          console.log("Selecionando funcionário:", { id: foundId, nome: foundNome });
          
          // Definir o funcionário selecionado
          setFuncionarioSelecionadoId(foundId);
          setFuncionarioSelecionadoNome(foundNome);
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
      
      if (etapaInfo.funcionarioNome) {
        setFuncionarioSelecionadoNome(etapaInfo.funcionarioNome);
      } else {
        // Buscar nome do funcionário se não estiver definido
        const funcionarioEncontrado = funcionariosOptions.find(f => f.id === etapaInfo.funcionarioId);
        if (funcionarioEncontrado) {
          setFuncionarioSelecionadoNome(funcionarioEncontrado.nome);
        }
      }
    }
  }, [etapaInfo?.funcionarioId, etapaInfo?.funcionarioNome, funcionariosOptions]);
  
  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    if (funcionarioSelecionado) {
      setFuncionarioSelecionadoNome(funcionarioSelecionado.nome);
    } else {
      console.warn("Funcionário não encontrado na lista para o ID:", value);
    }
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
