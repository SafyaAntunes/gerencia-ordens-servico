
import { OrdemServico, StatusOS, EtapaOS } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDetailsTab } from "@/components/ordens/detalhes/OrderDetailsTab";
import { FotosTab } from "@/components/ordens/detalhes/FotosTab";
import { ServicoControlTab } from "@/components/ordens/detalhes/ServicoControlTab";

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
        <TabsTrigger value="controle-servicos" className="flex-1">Controle de Serviços</TabsTrigger>
        <TabsTrigger value="fotos" className="flex-1">Fotos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="detalhes">
        <OrderDetailsTab ordem={ordem} onStatusChange={onStatusChange} />
      </TabsContent>
      
      <TabsContent value="controle-servicos">
        <ServicoControlTab ordem={ordem} onOrdemUpdate={onOrdemUpdate} />
      </TabsContent>
      
      <TabsContent value="fotos">
        <FotosTab ordem={ordem} onOrdemUpdate={onOrdemUpdate} />
      </TabsContent>
    </Tabs>
  );
}
