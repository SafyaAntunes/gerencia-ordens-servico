
import { OrdemServico, StatusOS } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDetailsTab } from "@/components/ordens/detalhes/OrderDetailsTab";
import { FotosTab } from "@/components/ordens/detalhes/FotosTab";
import EtapasTracker from "@/components/ordens/etapas-tracker/EtapasTracker";
import ProgressoRelatorio from "@/components/ordens/ProgressoRelatorio";

interface OrdemDetailTabsProps {
  ordem: OrdemServico;
  activeTab: string;
  onTabChange: (value: string) => void;
  onStatusChange: (status: StatusOS) => void;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function OrdemDetailsTabs({ 
  ordem, 
  activeTab, 
  onTabChange, 
  onStatusChange,
  onOrdemUpdate
}: OrdemDetailTabsProps) {
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
