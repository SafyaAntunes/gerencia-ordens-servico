
import { LayoutGrid, LayoutList } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ViewToggleProps {
  viewType: "grid" | "list";
  onViewTypeChange: (value: "grid" | "list") => void;
}

export default function ViewToggle({ viewType, onViewTypeChange }: ViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={viewType} 
      onValueChange={(value) => value && onViewTypeChange(value as "grid" | "list")}
    >
      <ToggleGroupItem value="grid" aria-label="Visualização em grid">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Visualização em lista">
        <LayoutList className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
