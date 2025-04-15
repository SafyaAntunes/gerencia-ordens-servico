
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { OrdemServico } from "@/types/ordens";

interface OrdemSearchProps {
  ordens: OrdemServico[];
  onSearch: (ordem: OrdemServico | null) => void;
  placeholder?: string;
}

export default function OrdemSearch({ ordens, onSearch, placeholder = "Buscar OS por ID ou nome..." }: OrdemSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = () => {
    if (!searchTerm) {
      onSearch(null);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Buscar por ID ou nome da OS
    const result = ordens.find(ordem => 
      ordem.id.toLowerCase().includes(searchTermLower) || 
      ordem.nome.toLowerCase().includes(searchTermLower)
    );
    
    onSearch(result || null);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  return (
    <div className="flex gap-2 mb-6">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyPress}
        className="max-w-md"
      />
      <Button variant="outline" onClick={handleSearch}>
        <Search className="h-4 w-4 mr-2" />
        Buscar
      </Button>
    </div>
  );
}
