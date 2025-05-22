<<<<<<< HEAD

import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import MotorList from "@/components/motores/MotorList";
import MotorDialog from "@/components/motores/MotorDialog";
import { useMotores } from "@/hooks/useMotores";

const Motores = () => {
  const { motores, loading, fetchMotores } = useMotores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMotor, setEditingMotor] = useState(null);

  useEffect(() => {
    fetchMotores();
  }, [fetchMotores]);

  const handleOpenDialog = (motor = null) => {
    setEditingMotor(motor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (shouldRefresh = false) => {
    setIsDialogOpen(false);
    setEditingMotor(null);
    if (shouldRefresh) {
      fetchMotores();
=======
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
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
import Layout from "@/components/layout/Layout";

interface Motor {
  id: number;
  numeroSerie: string;
  modelo: string;
  potencia: string;
  fabricante: string;
  anoFabricacao: string;
  marca: string;
  quantidadeCilindros: string;
  combustivel: string;
}

export default function Motores({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [motores, setMotores] = useState<Motor[]>([]);
  const [motorParaExcluir, setMotorParaExcluir] = useState<Motor | null>(null);

  useEffect(() => {
    carregarMotores();
  }, []);

  const carregarMotores = async () => {
    try {
      setLoading(true);
      const motores = JSON.parse(localStorage.getItem('motores') || '[]');
      setMotores(motores);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de motores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!motorParaExcluir) return;

    try {
      setLoading(true);
      // TODO: Implementar chamada à API para excluir motor
      // await api.delete(`/motores/${motorParaExcluir.id}`);
      toast({
        title: "Sucesso",
        description: "Motor excluído com sucesso!",
      });
      carregarMotores();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o motor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setMotorParaExcluir(null);
>>>>>>> 9342a9b (teste)
    }
  };

  return (
<<<<<<< HEAD
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Motores</h1>
          <Button onClick={() => handleOpenDialog(null)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Motor
          </Button>
        </div>

        <MotorList 
          motores={motores}
          loading={loading}
          onEdit={handleOpenDialog}
          onRefresh={fetchMotores}
        />
        
        <MotorDialog 
          open={isDialogOpen}
          onClose={handleCloseDialog}
          motor={editingMotor}
        />
      </div>
    </Layout>
  );
};

export default Motores;
=======
    <Layout onLogout={onLogout}>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Motores</CardTitle>
            <Button onClick={() => navigate("/motores/cadastro")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Motor
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Qtd. Cilindros</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Nenhum motor cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    motores.map((motor) => (
                      <TableRow key={motor.id}>
                        <TableCell>{motor.marca}</TableCell>
                        <TableCell>{motor.modelo}</TableCell>
                        <TableCell>{motor.quantidadeCilindros}</TableCell>
                        <TableCell>{motor.combustivel}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/motores/editar/${motor.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMotorParaExcluir(motor)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!motorParaExcluir} onOpenChange={() => setMotorParaExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este motor? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleExcluir}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
} 
>>>>>>> 9342a9b (teste)
