
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { EtapaOS, Servico, TipoServico } from "@/types/ordens";

import { EtapaStatus } from "./EtapaStatus";
import { EtapaProgresso } from "./EtapaProgresso";
import { EtapaServicosLista } from "./components";
import FuncionarioSelector from "./components/FuncionarioSelector";
import EtapaConcluirButton from "./components/EtapaConcluirButton";
import EtapaTimerSection from "./components/EtapaTimerSection";
import { useEtapaSubatividades } from "./hooks/useEtapaSubatividades";

export interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos: Servico[];
  etapaInfo: any;
  servicoTipo?: TipoServico;
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string, servicoTipo?: TipoServico) => void;
  onSubatividadeSelecionadaToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
}

export function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  etapaInfo = {},
  servicoTipo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange,
  onSubatividadeSelecionadaToggle
}: EtapaCardProps) {
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>(
    etapaInfo?.funcionarioId || funcionarioId || ""
  );
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>(
    etapaInfo?.funcionarioNome || funcionarioNome || ""
  );
  const [funcionariosOptions, setFuncionariosOptions] = useState<any[]>([]);
  const [isSavingResponsavel, setIsSavingResponsavel] = useState(false);
  const [isLoadingFuncionarios, setIsLoadingFuncionarios] = useState(false);
  const { verificarSubatividadesConcluidas, todasSubatividadesConcluidas } = useEtapaSubatividades();

  // Função para buscar os funcionários
  const fetchFuncionarios = useCallback(async () => {
    try {
      setIsLoadingFuncionarios(true);
      // Simula uma chamada à API
      // Em uma implementação real, você buscaria os dados do banco
      const funcionarios = [
        { id: funcionarioId, nome: funcionarioNome || "Funcionário atual" }
      ];
      
      // Adicionar o funcionário da etapa se ele existir
      if (etapaInfo?.funcionarioId && etapaInfo.funcionarioId !== funcionarioId) {
        funcionarios.push({
          id: etapaInfo.funcionarioId,
          nome: etapaInfo.funcionarioNome || "Funcionário da etapa"
        });
      }
      
      setFuncionariosOptions(funcionarios);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      toast.error("Erro ao buscar funcionários");
    } finally {
      setIsLoadingFuncionarios(false);
    }
  }, [funcionarioId, funcionarioNome, etapaInfo]);
  
  // Carregar funcionários quando o componente montar
  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);
  
  // Manter o estado sincronizado com as props
  useEffect(() => {
    setFuncionarioSelecionadoId(etapaInfo?.funcionarioId || funcionarioId || "");
    setFuncionarioSelecionadoNome(etapaInfo?.funcionarioNome || funcionarioNome || "");
  }, [etapaInfo?.funcionarioId, funcionarioId, etapaInfo?.funcionarioNome, funcionarioNome]);
  
  const handleFuncionarioChange = useCallback((id: string) => {
    const funcionario = funcionariosOptions.find(f => f.id === id);
    setFuncionarioSelecionadoId(id);
    setFuncionarioSelecionadoNome(funcionario?.nome || "");
  }, [funcionariosOptions]);
  
  const handleSaveResponsavel = useCallback(async (idArray?: string[], nomeArray?: string[]) => {
    try {
      setIsSavingResponsavel(true);
      
      // Usar o primeiro elemento de cada array, se estiverem presentes
      const id = idArray && idArray.length > 0 ? idArray[0] : "";
      const nome = nomeArray && nomeArray.length > 0 ? nomeArray[0] : "";
      
      // Atualizar o estado local primeiro
      setFuncionarioSelecionadoId(id);
      setFuncionarioSelecionadoNome(nome);
      
      // Chamar método pai para atualizar etapa
      if (onEtapaStatusChange) {
        await onEtapaStatusChange(etapa, false, id, nome, servicoTipo);
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar responsável:", error);
      toast.error("Erro ao salvar responsável");
      return false;
    } finally {
      setIsSavingResponsavel(false);
    }
  }, [etapa, onEtapaStatusChange, servicoTipo]);
  
  const handleConcluirEtapa = useCallback(async (concluir: boolean) => {
    if (concluir && !verificarSubatividadesConcluidas(servicos)) {
      return false;
    }
    
    if (!funcionarioSelecionadoId) {
      toast.error("Selecione um responsável antes de concluir a etapa");
      return false;
    }
    
    try {
      await onEtapaStatusChange(
        etapa,
        concluir,
        funcionarioSelecionadoId,
        funcionarioSelecionadoNome,
        servicoTipo
      );
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
      return false;
    }
  }, [etapa, funcionarioSelecionadoId, funcionarioSelecionadoNome, onEtapaStatusChange, servicos, servicoTipo, verificarSubatividadesConcluidas]);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">{etapaNome}</h2>
            <EtapaProgresso servicos={servicos} etapaInfo={etapaInfo} />
          </div>
          <EtapaStatus concluido={etapaInfo?.concluido} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <FuncionarioSelector
          ordemId={ordemId}
          etapa={etapa}
          servicoTipo={servicoTipo}
          funcionarioSelecionadoId={funcionarioSelecionadoId}
          funcionariosOptions={funcionariosOptions}
          isEtapaConcluida={!!etapaInfo?.concluido}
          onFuncionarioChange={handleFuncionarioChange}
          onSaveResponsavel={handleSaveResponsavel}
          isSaving={isSavingResponsavel}
        />
        
        <EtapaTimerSection
          etapa={etapa}
          ordemId={ordemId}
          servicoTipo={servicoTipo}
          etapaInfo={etapaInfo}
          disabled={!funcionarioSelecionadoId || etapaInfo?.concluido}
        />
        
        <EtapaServicosLista
          servicos={servicos}
          ordemId={ordemId}
          funcionarioId={funcionarioSelecionadoId}
          funcionarioNome={funcionarioSelecionadoNome}
          etapa={etapa}
          onSubatividadeToggle={onSubatividadeToggle}
          onServicoStatusChange={onServicoStatusChange}
        />
      </CardContent>
      
      <CardFooter className="pt-2">
        <EtapaConcluirButton
          concluido={!!etapaInfo?.concluido}
          todasSubatividadesConcluidas={todasSubatividadesConcluidas(servicos)}
          onConcluir={handleConcluirEtapa}
          temFuncionarioSelecionado={!!funcionarioSelecionadoId}
        />
      </CardFooter>
    </Card>
  );
}
