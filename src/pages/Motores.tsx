
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { MotoresList } from '@/components/motores/MotoresList';
import { MotorForm } from '@/components/motores/MotorForm';
import { useMotores } from '@/hooks/useMotores';
import { Motor } from '@/types/motor';
import { Button } from '@/components/ui/button';
import ExportButton from '@/components/common/ExportButton';
import ImportButton from '@/components/common/ImportButton';
import { toast } from 'sonner';

interface MotoresProps {
  onLogout: () => void;
}

export default function Motores({ onLogout }: MotoresProps) {
  const { motores, isLoading, saveMotor, deleteMotor, isSaving } = useMotores();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMotor, setCurrentMotor] = useState<Motor | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleImportMotores = async (data: any) => {
    if (!Array.isArray(data)) {
      toast.error('Formato inválido. Esperado uma lista de motores.');
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    
    try {
      for (const motorData of data) {
        if (!motorData.marca || !motorData.modelo) {
          continue;
        }
        
        const motor: Motor = {
          id: '',
          ...motorData,
        };
        
        saveMotor(motor);
        successCount++;
      }
      
      toast.success(`${successCount} motor(es) importado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar motores:', error);
      toast.error('Erro ao importar motores.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const validateMotorData = (data: any): boolean => {
    return Array.isArray(data) && data.some(item => !!item.marca && !!item.modelo);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Motores</h1>
            <p className="text-muted-foreground">
              Gerencie os motores cadastrados na sua retífica
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <ImportButton 
              onImport={handleImportMotores} 
              validateData={validateMotorData}
              disabled={isSubmitting}
            />
            <ExportButton 
              data={motores}
              fileName="motores.json"
              disabled={motores.length === 0}
            />
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Motor
            </Button>
          </div>
        </div>

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
