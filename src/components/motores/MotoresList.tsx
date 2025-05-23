
import { useState } from 'react';
import { Motor } from '@/types/motor';
import { Button } from '@/components/ui/button';
import { EditIcon, Trash2Icon, PlusIcon, Wrench } from 'lucide-react';
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

  const filteredMotores = motores.filter((motor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      motor.marca.toLowerCase().includes(searchLower) ||
      motor.modelo.toLowerCase().includes(searchLower) ||
      (motor.numeroSerie && motor.numeroSerie.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Buscar por marca, modelo ou nº de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Button onClick={onAdd}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Motor
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredMotores.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum motor encontrado</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm ? 'Tente outra busca ou cadastre um novo motor.' : 'Cadastre um novo motor para começar.'}
            </p>
            <div className="mt-6">
              <Button onClick={onAdd}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Motor
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
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
          </div>
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
