
import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, RefreshCw } from "lucide-react";
import { Motor } from "@/types/motores";
import { useMotores } from "@/hooks/useMotores";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface MotorListProps {
  motores: Motor[];
  loading: boolean;
  onEdit: (motor: Motor) => void;
  onRefresh: () => void;
}

const MotorList = ({ motores, loading, onEdit, onRefresh }: MotorListProps) => {
  const { deleteMotor } = useMotores();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingMotor, setDeletingMotor] = useState<Motor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingMotor) return;
    
    setIsDeleting(true);
    try {
      await deleteMotor(deletingMotor.id);
      toast.success("Motor excluído com sucesso");
      onRefresh();
    } catch (error) {
      console.error("Erro ao excluir motor:", error);
      toast.error("Erro ao excluir motor");
    } finally {
      setIsDeleting(false);
      setDeletingMotor(null);
    }
  };

  const filteredMotores = motores.filter(motor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      motor.marca?.toLowerCase().includes(searchLower) ||
      motor.modelo?.toLowerCase().includes(searchLower) ||
      motor.descricao?.toLowerCase().includes(searchLower) ||
      motor.familia?.toLowerCase().includes(searchLower)
    );
  });

  const getCombustivelLabel = (combustivel: string) => {
    const labels: Record<string, string> = {
      gasolina: "Gasolina",
      diesel: "Diesel",
      flex: "Flex",
      etanol: "Etanol",
      gnv: "GNV"
    };
    return labels[combustivel] || combustivel;
  };

  const getCombustivelColor = (combustivel: string) => {
    const colors: Record<string, string> = {
      gasolina: "bg-red-100 text-red-800",
      diesel: "bg-yellow-100 text-yellow-800",
      flex: "bg-purple-100 text-purple-800",
      etanol: "bg-green-100 text-green-800",
      gnv: "bg-blue-100 text-blue-800"
    };
    return colors[combustivel] || "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por marca, modelo ou família..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button variant="outline" onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando motores...</p>
        </div>
      ) : filteredMotores.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">
            {searchTerm ? "Nenhum motor encontrado para essa busca." : "Nenhum motor cadastrado."}
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Família</TableHead>
                  <TableHead>Cilindros</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMotores.map((motor) => (
                  <TableRow key={motor.id}>
                    <TableCell>{motor.marca}</TableCell>
                    <TableCell>{motor.modelo}</TableCell>
                    <TableCell>{motor.descricao}</TableCell>
                    <TableCell>{motor.familia}</TableCell>
                    <TableCell>{motor.cilindros}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getCombustivelColor(motor.combustivel)}>
                        {getCombustivelLabel(motor.combustivel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={motor.ativo ? "success" : "secondary"}>
                        {motor.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(motor)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingMotor(motor)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AlertDialog 
        open={!!deletingMotor} 
        onOpenChange={(open) => !open && setDeletingMotor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o motor {deletingMotor?.marca} {deletingMotor?.modelo}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MotorList;
