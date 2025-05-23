
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Motor } from '@/types/motor';
import { getMotores, saveMotor, deleteMotor } from '@/services/motorService';
import { toast } from 'sonner';

export const useMotores = () => {
  const queryClient = useQueryClient();

  // Fetch all motors
  const { 
    data: motores, 
    isLoading, 
    error, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['motores'],
    queryFn: getMotores
  });

  // Create or update motor
  const createUpdateMotorMutation = useMutation({
    mutationFn: (motor: Motor) => saveMotor(motor),
    onSuccess: () => {
      toast.success('Motor salvo com sucesso');
      queryClient.invalidateQueries({ queryKey: ['motores'] });
    },
    onError: (error) => {
      console.error('Error saving motor:', error);
      toast.error('Erro ao salvar o motor');
    }
  });

  // Delete motor
  const deleteMotorMutation = useMutation({
    mutationFn: (id: string) => deleteMotor(id),
    onSuccess: () => {
      toast.success('Motor removido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['motores'] });
    },
    onError: (error) => {
      console.error('Error deleting motor:', error);
      toast.error('Erro ao remover o motor');
    }
  });

  return {
    motores: motores || [],
    isLoading,
    error,
    isError,
    refetch,
    saveMotor: createUpdateMotorMutation.mutate,
    deleteMotor: deleteMotorMutation.mutate,
    isSaving: createUpdateMotorMutation.isPending,
    isDeleting: deleteMotorMutation.isPending
  };
};
