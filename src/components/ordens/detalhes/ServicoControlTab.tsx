import { useState } from "react";
import { OrdemServico, Servico } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicoControl } from "@/components/ordens/servico/ServicoControl";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ServicoControlTabProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function ServicoControlTab({ ordem, onOrdemUpdate }: ServicoControlTabProps) {
  const { funcionario } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleServicoStatusChange = (servicoIndex: number, status: 'em_andamento' | 'pausado' | 'concluido', funcionarioId?: string, funcionarioNome?: string) => {
    setIsUpdating(true);

    try {
      // Clone the services array
      const servicosAtualizados = [...ordem.servicos];
      
      // Update the specific service
      const servico = servicosAtualizados[servicoIndex];
      
      // Update service attributes based on status
      if (status === 'concluido') {
        servicosAtualizados[servicoIndex] = {
          ...servico,
          concluido: true,
          funcionarioId: funcionarioId || funcionario?.id || '',
          funcionarioNome: funcionarioNome || funcionario?.nome || '',
          dataConclusao: new Date()
        };
      } else {
        // For other statuses, just update the status flag, keep the concluido state as is
        servicosAtualizados[servicoIndex] = {
          ...servico,
          status: status
        };
      }
      
      // Update the complete ordem
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Call the parent function to update the ordem
      onOrdemUpdate(ordemAtualizada);
      
      // Show success message
      toast.success(`Serviço ${servico.tipo} ${status === 'concluido' ? 'concluído' : status === 'pausado' ? 'pausado' : 'em andamento'}`);
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      toast.error("Erro ao atualizar o status do serviço");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!ordem.servicos || ordem.servicos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Controle de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Esta ordem não possui serviços registrados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Controle de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ordem.servicos.map((servico, index) => (
              <ServicoControl
                key={`${servico.tipo}-${index}`}
                servico={servico}
                ordemId={ordem.id}
                isDisabled={isUpdating}
                funcionarioId={funcionario?.id}
                funcionarioNome={funcionario?.nome}
                onStatusChange={(status, funcId, funcNome) => 
                  handleServicoStatusChange(index, status, funcId, funcNome)
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
