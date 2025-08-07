
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ViewToggle from "./ViewToggle";
import OrdensAdvancedFilter, { FilterCriteria } from "./OrdensAdvancedFilter";

interface OrdensHeaderProps {
  title: string;
  isTecnico: boolean;
  viewType: "grid" | "list" | "presentation";
  onViewTypeChange: (type: "grid" | "list" | "presentation") => void;
  onNovaOrdem: () => void;
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
}

export default function OrdensHeader({
  title,
  isTecnico,
  viewType,
  onViewTypeChange,
  onNovaOrdem,
  filters,
  onFiltersChange
}: OrdensHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {viewType !== 'presentation' && (
            <OrdensAdvancedFilter
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          )}
          
          <div className="flex items-center gap-2">
            <ViewToggle viewType={viewType} onViewTypeChange={onViewTypeChange} />
            
            {!isTecnico && viewType !== 'presentation' && (
              <Button onClick={onNovaOrdem}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ordem
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
