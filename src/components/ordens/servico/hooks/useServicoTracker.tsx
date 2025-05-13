
import { useState, useEffect } from 'react';
import { ServicoStatus } from './types/servicoTrackerTypes';
import { Servico } from '@/types/ordens';
import { useToast } from '@/components/ui/use-toast';

export const useServicoTracker = (servico: Servico | undefined) => {
  const [status, setStatus] = useState<ServicoStatus>('pending');
  const [responsavel, setResponsavel] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (servico) {
      // Determine status based on servico properties
      if (servico.concluido) {
        setStatus('completed');
      } else if (servico.funcionarioId) {
        setStatus('in-progress');
      } else {
        setStatus('pending');
      }

      // Set responsible person if available
      if (servico.funcionarioNome) {
        setResponsavel(servico.funcionarioNome);
      }
    }
  }, [servico]);

  const handleAtribuir = (funcionarioId: string, funcionarioNome: string) => {
    if (!servico) return;
    
    // Update servico with assigned employee
    const updatedServico = {
      ...servico,
      funcionarioId,
      funcionarioNome
    };

    // Here you would typically update the database
    // For now, just update local state
    setResponsavel(funcionarioNome);
    setStatus('in-progress');
    
    toast({
      title: "Funcionário atribuído",
      description: `${funcionarioNome} foi atribuído a este serviço.`
    });
    
    return updatedServico;
  };

  const handleConcluir = () => {
    if (!servico) return;
    
    // Mark servico as completed
    const updatedServico = {
      ...servico,
      concluido: true,
      dataConclusao: new Date()
    };

    // Update local state
    setStatus('completed');
    
    toast({
      title: "Serviço concluído",
      description: "Este serviço foi marcado como concluído."
    });
    
    return updatedServico;
  };

  const handleReabrir = () => {
    if (!servico) return;
    
    // Reopen servico
    const updatedServico = {
      ...servico,
      concluido: false,
      dataConclusao: undefined
    };

    // Update local state
    setStatus('in-progress');
    
    toast({
      title: "Serviço reaberto",
      description: "Este serviço foi reaberto."
    });
    
    return updatedServico;
  };

  return {
    status,
    responsavel,
    handleAtribuir,
    handleConcluir,
    handleReabrir
  };
};
