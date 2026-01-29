
import { useState } from 'react';
import { Motor } from '@/types/motor';
import { Button } from '@/components/ui/button';
import { EditIcon, Trash2Icon, PlusIcon, Wrench, Search, FilterX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface MotoresListProps {
  motores: Motor[];
  onEdit: (motor: Motor) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading: boolean;
}

export function MotoresList({ motores, onEdit, onDelete, onAdd, isLoading }: MotoresListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [motorToDelete, setMotorToDelete] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (motorToDelete) {
      onDelete(motorToDelete);
      setMotorToDelete(null);
    }
  };

  const filteredMotores = motores
    .filter((motor) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        motor.marca.toLowerCase().includes(searchLower) ||
        motor.modelo.toLowerCase().includes(searchLower) ||
        (motor.numeroSerie && motor.numeroSerie.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const marcaCompare = a.marca.localeCompare(b.marca);
      if (marcaCompare !== 0) return marcaCompare;
      return a.modelo.localeCompare(b.modelo);
    });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo ou nº de série..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && (
            <Button variant="outline" size="icon" onClick={() => setSearchTerm("")}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredMotores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum motor encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {searchTerm ? (
                <>
                  Não encontramos nenhum motor com o termo <strong>"{searchTerm}"</strong>. Tente ajustar a busca ou cadastre um novo motor.
                </>
              ) : (
                "Comece adicionando seu primeiro motor para associar às ordens de serviço."
              )}
            </p>
            <Button className="mt-4" onClick={onAdd}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Novo Motor
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Cilindros</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMotores.map((motor) => (
                    <TableRow key={motor.id}>
                      <TableCell className="font-medium">{motor.marca}</TableCell>
                      <TableCell>{motor.modelo}</TableCell>
                      <TableCell>{motor.numeroCilindros || "-"}</TableCell>
                      <TableCell>
                        {motor.combustivel ? (
                          <Badge variant="outline">
                            {motor.combustivel.charAt(0).toUpperCase() + motor.combustivel.slice(1)}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{motor.numeroSerie || "-"}</TableCell>
                      <TableCell>{motor.clienteNome || "Sem cliente"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => onEdit(motor)}>
                            <EditIcon className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setMotorToDelete(motor.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!motorToDelete} onOpenChange={(open) => !open && setMotorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este motor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
