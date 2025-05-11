
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDetailsTab } from "@/components/ordens/detalhes/OrderDetailsTab";
import { FotosTab } from "@/components/ordens/detalhes/FotosTab";
import EtapasTracker from "@/components/ordens/EtapasTracker";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";

interface OrdemTabsProps {
  ordem: OrdemServico;
  activeTab: string;
  onTabChange: (value: string) => void;
  onStatusChange: (status: StatusOS) => void;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function OrdemTabs({ 
  ordem, 
  activeTab, 
  onTabChange, 
  onStatusChange,
  onOrdemUpdate
}: OrdemTabsProps) {
  // Função para atualizar funcionários em uma etapa
  const handleFuncionariosChange = (
    etapa: EtapaOS, 
    funcionariosIds: string[], 
    funcionariosNomes: string[], 
    servicoTipo?: string
  ) => {
    const ordemAtualizada = { ...ordem };
    
    // Determinar a chave da etapa baseando-se no tipo de serviço, se aplicável
    const etapaKey = 
      (["inspecao_inicial", "inspecao_final", "lavagem"].includes(etapa) && servicoTipo) 
        ? `${etapa}_${servicoTipo}` 
        : etapa;
    
    // Garantir que etapasAndamento existe
    if (!ordemAtualizada.etapasAndamento) {
      ordemAtualizada.etapasAndamento = {};
    }
    
    // Garantir que a etapa específica existe
    if (!ordemAtualizada.etapasAndamento[etapaKey]) {
      ordemAtualizada.etapasAndamento[etapaKey] = {
        concluido: false
      };
    }
    
    // Atualizar funcionários
    ordemAtualizada.etapasAndamento[etapaKey] = {
      ...ordemAtualizada.etapasAndamento[etapaKey],
      funcionariosIds,
      funcionariosNomes,
      // Se houver pelo menos um funcionário, definir o principal
      funcionarioId: funcionariosIds.length > 0 ? funcionariosIds[0] : "",
      funcionarioNome: funcionariosNomes.length > 0 ? funcionariosNomes[0] : ""
    };
    
    onOrdemUpdate(ordemAtualizada);
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger>
        <TabsTrigger value="tracker" className="flex-1">Tracker</TabsTrigger>
        <TabsTrigger value="progresso" className="flex-1">Progresso</TabsTrigger>
        <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="detalhes">
        <OrderDetailsTab ordem={ordem} onStatusChange={onStatusChange} />
      </TabsContent>
      
      <TabsContent value="tracker">
        <EtapasTracker 
          ordem={ordem} 
          onOrdemUpdate={onOrdemUpdate} 
          onFuncionariosChange={handleFuncionariosChange}
        />
      </TabsContent>
      
      <TabsContent value="progresso">
        <ProgressoRelatorio ordem={ordem} />
      </TabsContent>
      
      <TabsContent value="fotos">
        <FotosTab ordem={ordem} onOrdemUpdate={onOrdemUpdate} />
      </TabsContent>
    </Tabs>
  );
}
