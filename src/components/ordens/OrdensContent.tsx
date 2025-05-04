
import { OrdemServico } from "@/types/ordens";
import OrdemCard from "@/components/ordens/OrdemCard";
import OrdemListRow from "@/components/ordens/ordem-list-row";

interface OrdensContentProps {
  loading: boolean;
  filteredOrdens: OrdemServico[];
  isTecnico: boolean;
  viewType: "grid" | "list";
  onReorder: (dragIndex: number, dropIndex: number) => void;
  onVerOrdem: (id: string) => void;
}

export default function OrdensContent({
  loading,
  filteredOrdens,
  isTecnico,
  viewType,
  onReorder,
  onVerOrdem
}: OrdensContentProps) {
  if (loading) {
    return <div className="text-center py-8">Carregando ordens...</div>;
  }
  
  if (filteredOrdens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isTecnico 
          ? "Nenhuma ordem encontrada para suas especialidades."
          : "Nenhuma ordem encontrada com os filtros selecionados."}
      </div>
    );
  }
  
  if (viewType === "grid") {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrdens.map((ordem, index) => (
          <OrdemCard 
            key={ordem.id} 
            ordem={ordem}
            index={index}
            onReorder={onReorder}
            onClick={() => onVerOrdem(ordem.id)}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredOrdens.map((ordem, index) => (
        <OrdemListRow
          key={ordem.id}
          ordem={ordem}
          index={index}
          onReorder={onReorder}
          onClick={() => onVerOrdem(ordem.id)}
        />
      ))}
    </div>
  );
}
