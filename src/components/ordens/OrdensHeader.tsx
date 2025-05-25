
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ViewToggle from "./ViewToggle";
import OrdensStatusFilter from "./OrdensStatusFilter";

interface OrdensHeaderProps {
  title: string;
  isTecnico: boolean;
  viewType: "grid" | "list";
  onViewTypeChange: (type: "grid" | "list") => void;
  onNovaOrdem: () => void;
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
}

export default function OrdensHeader({
  title,
  isTecnico,
  viewType,
  onViewTypeChange,
  onNovaOrdem,
  selectedStatus,
  onStatusChange
}: OrdensHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <OrdensStatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={onStatusChange}
          />
          
          <div className="flex items-center gap-2">
            <ViewToggle viewType={viewType} onViewTypeChange={onViewTypeChange} />
            
            {!isTecnico && (
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
