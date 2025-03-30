
import { Phone, Mail, Building, Trash, Edit, Eye, Car } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cliente } from "@/types/clientes";

interface ClienteCardProps {
  cliente: Cliente;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
}

export default function ClienteCard({ cliente, onView, onEdit, onDelete }: ClienteCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-border h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate pr-2">{cliente.nome}</span>
          {cliente.motores && cliente.motores.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {cliente.motores.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-3 space-y-3 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{cliente.nome}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{cliente.telefone || "Não informado"}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{cliente.email || "Não informado"}</span>
        </div>
        
        {cliente.observacoes && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {cliente.observacoes}
          </p>
        )}
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 flex justify-end">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(cliente)}>
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={() => onDelete(cliente.id)}>
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onView(cliente)}>
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
