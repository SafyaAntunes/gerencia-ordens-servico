
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderDetailsTab } from "./OrderDetailsTab";
import { ServicoControlTab } from "./ServicoControlTab";
import { AtribuicaoFuncionariosTab } from "./AtribuicaoFuncionariosTab";
import { FotosTab } from "./FotosTab";
import { OrdemServico, StatusOS } from "@/types/ordens";

type OrdemTabsProps = {
  ordem: OrdemServico;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onStatusChange: (status: StatusOS) => void;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
};

export function OrdemTabs({ 
  ordem, 
  activeTab, 
  onTabChange, 
  onStatusChange, 
  onOrdemUpdate 
}: OrdemTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        <TabsTrigger value="controle-servicos">Controle de Serviços</TabsTrigger>
        <TabsTrigger value="atribuicao-funcionarios">Atribuição de Funcionários</TabsTrigger>
        <TabsTrigger value="fotos">Fotos</TabsTrigger>
      </TabsList>
      
      <OrderDetailsTab 
        ordem={ordem}
        onStatusChange={onStatusChange}
      />
      
      <ServicoControlTab 
        ordem={ordem}
        onOrdemUpdate={onOrdemUpdate}
      />
      
      <AtribuicaoFuncionariosTab 
        ordem={ordem}
        onOrdemUpdate={onOrdemUpdate}
      />
      
      <FotosTab ordem={ordem} />
    </Tabs>
  );
}
