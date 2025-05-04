
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ViewToggle from "./ViewToggle";

interface OrdensHeaderProps {
  title: string;
  isTecnico: boolean;
  viewType: "grid" | "list";
  onViewTypeChange: (value: "grid" | "list") => void;
  onNovaOrdem: () => void;
}

export default function OrdensHeader({ 
  title, 
  isTecnico, 
  viewType, 
  onViewTypeChange, 
  onNovaOrdem 
}: OrdensHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-4">
        <ViewToggle viewType={viewType} onViewTypeChange={onViewTypeChange} />
        {!isTecnico && (
          <Button onClick={onNovaOrdem}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        )}
      </div>
    </div>
  );
}
