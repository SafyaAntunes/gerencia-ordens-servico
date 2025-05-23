
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { MotoresList } from '@/components/motores/MotoresList';
import { MotorForm } from '@/components/motores/MotorForm';
import { useMotores } from '@/hooks/useMotores';
import { Motor } from '@/types/motor';

interface MotoresProps {
  onLogout: () => void;
}

export default function Motores({ onLogout }: MotoresProps) {
  const { motores, isLoading, saveMotor, deleteMotor, isSaving } = useMotores();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMotor, setCurrentMotor] = useState<Motor | undefined>(undefined);

  const handleOpenAddDialog = () => {
    setCurrentMotor(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (motor: Motor) => {
    setCurrentMotor(motor);
    setIsFormOpen(true);
  };

  const handleSaveMotor = (motor: Motor) => {
    saveMotor(motor);
    setIsFormOpen(false);
  };

  const handleDeleteMotor = (id: string) => {
    deleteMotor(id);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Motores</h1>
        <MotoresList
          motores={motores}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteMotor}
          onAdd={handleOpenAddDialog}
          isLoading={isLoading}
        />

        <MotorForm
          open={isFormOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveMotor}
          motor={currentMotor}
          isLoading={isSaving}
        />
      </div>
    </Layout>
  );
}
