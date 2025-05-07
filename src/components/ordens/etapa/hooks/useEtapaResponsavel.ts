
import { toast } from "sonner";
import { EtapaOS, TipoServico } from "@/types/ordens";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseEtapaResponsavelProps {
  etapa: EtapaOS;
  servicoTipo?: TipoServico;
  funcionarioSelecionadoId: string;
  funcionarioSelecionadoNome: string;
  isEtapaConcluida: (etapaInfo?: any) => boolean;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  etapaInfo?: any;
  ordemId: string;
}

export function useEtapaResponsavel({
  etapa,
  servicoTipo,
  funcionarioSelecionadoId,
  funcionarioSelecionadoNome,
  isEtapaConcluida,
  onEtapaStatusChange,
  etapaInfo,
  ordemId
}: UseEtapaResponsavelProps) {
  // Estado para rastrear a última seleção de funcionário, garantindo persistência
  const [lastSavedFuncionarioId, setLastSavedFuncionarioId] = useState<string>("");
  const [lastSavedFuncionarioNome, setLastSavedFuncionarioNome] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Inicializa os valores salvos com os valores atuais de etapaInfo
  useEffect(() => {
    if (etapaInfo?.funcionarioId) {
      setLastSavedFuncionarioId(etapaInfo.funcionarioId);
      setLastSavedFuncionarioNome(etapaInfo.funcionarioNome || "");
      console.log(`useEtapaResponsavel: Inicializando com funcionário da etapaInfo - ID: ${etapaInfo.funcionarioId}, Nome: ${etapaInfo.funcionarioNome}`);
    }
  }, [etapaInfo]);
  
  // Carrega dados diretamente do Firestore ao montar o componente
  useEffect(() => {
    const carregarDadosDoFirestore = async () => {
      if (!ordemId) return;
      
      try {
        const ordemRef = doc(db, "ordens_servico", ordemId);
        const ordemDoc = await getDoc(ordemRef);
        
        if (ordemDoc.exists()) {
          const dados = ordemDoc.data();
          
          // Determinar a chave da etapa com base no tipo de serviço
          const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) 
            ? `${etapa}_${servicoTipo}` 
            : etapa;
            
          const etapaData = dados?.etapasAndamento?.[etapaKey];
          
          if (etapaData?.funcionarioId) {
            setLastSavedFuncionarioId(etapaData.funcionarioId);
            setLastSavedFuncionarioNome(etapaData.funcionarioNome || "");
            console.log(`Dados carregados do Firestore: Funcionário ${etapaData.funcionarioNome} (${etapaData.funcionarioId})`);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do responsável:", error);
      }
    };
    
    carregarDadosDoFirestore();
  }, [ordemId, etapa, servicoTipo]);
  
  // Função para salvar o responsável diretamente no Firebase
  const handleSaveResponsavel = async () => {
    if (!funcionarioSelecionadoId) {
      toast.error("É necessário selecionar um responsável para salvar");
      return;
    }

    if (!ordemId) {
      toast.error("ID da ordem não encontrado");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Determinar a chave da etapa com base no tipo de serviço
      const etapaKey = ((etapa === 'inspecao_inicial' || etapa === 'inspecao_final') && servicoTipo) 
        ? `${etapa}_${servicoTipo}` 
        : etapa;
      
      console.log(`Salvando responsável para etapa ${etapaKey}: ${funcionarioSelecionadoNome} (${funcionarioSelecionadoId})`);
      
      // Obter documento atual para garantir dados atualizados
      const ordemRef = doc(db, "ordens_servico", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem de serviço não encontrada");
        setIsSaving(false);
        return;
      }
      
      const dadosAtuais = ordemDoc.data();
      
      // Obter etapa atual para preservar dados
      const etapasAndamento = dadosAtuais.etapasAndamento || {};
      const etapaAtual = etapasAndamento[etapaKey] || {};
      const etapaConcluida = etapaAtual.concluido || false;
      
      // Preparar objeto para atualização
      const atualizacao = {
        [`etapasAndamento.${etapaKey}.funcionarioId`]: funcionarioSelecionadoId,
        [`etapasAndamento.${etapaKey}.funcionarioNome`]: funcionarioSelecionadoNome,
        [`etapasAndamento.${etapaKey}.concluido`]: etapaConcluida,
        // Se for primeira atribuição, definir data de início
        [`etapasAndamento.${etapaKey}.iniciado`]: etapaAtual.iniciado || new Date(),
      };
      
      // Atualizar o documento
      await updateDoc(ordemRef, atualizacao);
      
      // Atualizar valores salvos localmente
      setLastSavedFuncionarioId(funcionarioSelecionadoId);
      setLastSavedFuncionarioNome(funcionarioSelecionadoNome);
      
      // Chamar callback se existir (para atualizar estado pai)
      if (onEtapaStatusChange) {
        onEtapaStatusChange(
          etapa,
          etapaConcluida,
          funcionarioSelecionadoId,
          funcionarioSelecionadoNome,
          (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
        );
      }
      
      toast.success(`Responsável ${funcionarioSelecionadoNome} salvo com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Não foi possível salvar o responsável");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCustomTimerStart = (): boolean => {
    if (!funcionarioSelecionadoId && !lastSavedFuncionarioId) {
      toast.error("É necessário selecionar e salvar um responsável antes de iniciar a etapa");
      return false;
    }
    
    return true;
  };
  
  const handleMarcarConcluidoClick = () => {
    if (!funcionarioSelecionadoId && !lastSavedFuncionarioId) {
      toast.error("É necessário selecionar e salvar um responsável antes de concluir a etapa");
      return;
    }
    
    // Usar o último responsável salvo ou o atualmente selecionado
    const responsavelId = lastSavedFuncionarioId || funcionarioSelecionadoId;
    const responsavelNome = lastSavedFuncionarioNome || funcionarioSelecionadoNome;
    
    if (onEtapaStatusChange) {
      onEtapaStatusChange(
        etapa, 
        true, 
        responsavelId, 
        responsavelNome,
        (etapa === "inspecao_inicial" || etapa === "inspecao_final") ? servicoTipo : undefined
      );
    }
  };
  
  return {
    handleSaveResponsavel,
    handleCustomTimerStart,
    handleMarcarConcluidoClick,
    lastSavedFuncionarioId,
    lastSavedFuncionarioNome,
    isSaving
  };
}
