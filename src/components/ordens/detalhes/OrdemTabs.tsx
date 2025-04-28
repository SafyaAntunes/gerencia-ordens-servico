
import { OrdemServico, StatusOS } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDetailsTab } from "@/components/ordens/detalhes/OrderDetailsTab";
import { FotosTab } from "@/components/ordens/detalhes/FotosTab";
import EtapasTracker from "@/components/ordens/EtapasTracker";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";
import PausaRelatorio from "@/components/ordens/PausaRelatorio";

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
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger>
        <TabsTrigger value="tracker" className="flex-1">Tracker</TabsTrigger>
        <TabsTrigger value="progresso" className="flex-1">Progresso</TabsTrigger>
        <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
        <TabsTrigger value="relatorio" className="flex-1">Relatório de Pausas</TabsTrigger>
      </TabsList>
      
      <TabsContent value="detalhes">
        <OrderDetailsTab ordem={ordem} onStatusChange={onStatusChange} />
      </TabsContent>
      
      <TabsContent value="tracker">
        <EtapasTracker ordem={ordem} onOrdemUpdate={onOrdemUpdate} />
      </TabsContent>
      
      <TabsContent value="progresso">
        <ProgressoRelatorio ordem={ordem} />
      </TabsContent>
      
      <TabsContent value="fotos">
        <FotosTab ordem={ordem} />
      </TabsContent>
      
      <TabsContent value="relatorio">
        <PausaRelatorio ordem={ordem} />
      </TabsContent>
    </Tabs>
  );
}
