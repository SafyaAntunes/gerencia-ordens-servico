
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
    }
  };

  return (
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
