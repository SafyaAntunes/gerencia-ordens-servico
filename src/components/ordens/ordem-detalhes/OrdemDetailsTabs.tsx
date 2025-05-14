
import { OrdemServico, StatusOS } from "@/types/ordens";
import { OrdemTabs } from "@/components/ordens/detalhes/OrdemTabs";

interface OrdemDetailsTabsProps {
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
}: OrdemDetailsTabsProps) {
  return (
    <OrdemTabs
      ordem={ordem}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onStatusChange={onStatusChange}
      onOrdemUpdate={onOrdemUpdate}
    />
  );
}
