import { Building, Phone, Mail, MapPin, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { Cliente, Endereco } from "@/types/clientes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClienteListItemProps {
  cliente: Cliente;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
}

const getEnderecoDisplay = (endereco?: string | Endereco): string => {
  if (!endereco) return "-";
  if (typeof endereco === "string") return endereco || "-";
  
  const { cidade, estado } = endereco;
  if (cidade && estado) return `${cidade}, ${estado}`;
  return cidade || estado || "-";
};

export default function ClienteListItem({ cliente, onView, onEdit, onDelete }: ClienteListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Building className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
          <div className="font-medium truncate">{cliente.nome}</div>
          
          <div className="flex items-center text-sm text-muted-foreground truncate">
            <Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{cliente.email || "-"}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground truncate">
            <Phone className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{cliente.telefone || "-"}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground truncate">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{getEnderecoDisplay(cliente.endereco)}</span>
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(cliente)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(cliente)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onDelete(cliente.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
