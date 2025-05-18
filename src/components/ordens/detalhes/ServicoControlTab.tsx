
import { useState } from "react";
import { OrdemServico, Servico } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicoControl } from "@/components/ordens/servico/ServicoControl";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { marcarFuncionarioEmServico, liberarFuncionarioDeServico } from "@/services/funcionarioEmServicoService";

interface ServicoControlTabProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordemAtualizada: OrdemServico) => void;
}

export function ServicoControlTab({ ordem, onOrdemUpdate }: ServicoControlTabProps) {
  const { funcionario } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleServicoStatusChange = async (servicoIndex: number, status: 'em_andamento' | 'pausado' | 'concluido', funcionarioId?: string, funcionarioNome?: string) => {
    setIsUpdating(true);

    try {
      console.log(`Alterando status do serviço ${servicoIndex} para ${status} com funcionário ${funcionarioId || 'não informado'}`);
      
      // Clone the services array
      const servicosAtualizados = [...ordem.servicos];
      
      // Update the specific service
      const servico = servicosAtualizados[servicoIndex];
      
      // Se o status está mudando para "em_andamento" e temos um funcionário selecionado,
      // precisamos marcar o funcionário como ocupado
      if (status === 'em_andamento' && funcionarioId && (status !== servico.status || funcionarioId !== servico.funcionarioId)) {
        console.log(`Marcando funcionário ${funcionarioId} como ocupado na ordem ${ordem.id}`);
        
        // Garantimos que o funcionário é marcado como ocupado PRIMEIRO
        const marcadoComoOcupado = await marcarFuncionarioEmServico(
          funcionarioId,
          ordem.id,
          'retifica', // Default etapa - isso poderia ser um parâmetro mais específico
          servico.tipo
        );
        
        if (!marcadoComoOcupado) {
          toast.error("Não foi possível marcar o funcionário como ocupado");
          setIsUpdating(false);
          return;
        }
        
        console.log(`Funcionário ${funcionarioId} marcado como ocupado com sucesso`);
      }
      
      // Se o status atual é "em_andamento" e está mudando para outro, liberar o funcionário
      if (servico.status === 'em_andamento' && status !== 'em_andamento' && servico.funcionarioId) {
        console.log(`Liberando funcionário ${servico.funcionarioId} do serviço`);
        await liberarFuncionarioDeServico(servico.funcionarioId);
        console.log(`Funcionário ${servico.funcionarioId} liberado com sucesso`);
      }
      
      // Update service attributes based on status
      if (status === 'concluido') {
        servicosAtualizados[servicoIndex] = {
          ...servico,
          concluido: true,
          status: status,
          // Usar o funcionário atribuído para este serviço
          funcionarioId: funcionarioId || servico.funcionarioId || '',
          funcionarioNome: funcionarioNome || servico.funcionarioNome || '',
          dataConclusao: new Date()
        };
        
        // Ao concluir, garantir que o funcionário seja liberado
        if (funcionarioId) {
          await liberarFuncionarioDeServico(funcionarioId);
        }
      } else {
        // Para outros statuses, atualizar o status e manter os dados do funcionário
        servicosAtualizados[servicoIndex] = {
          ...servico,
          status: status,
          // Persistir o funcionário mesmo para serviços não concluídos
          funcionarioId: funcionarioId || servico.funcionarioId,
          funcionarioNome: funcionarioNome || servico.funcionarioNome,
          // Adicionar data de início quando o serviço começa
          ...(status === 'em_andamento' && !servico.dataInicio ? { dataInicio: new Date() } : {})
        };
      }
      
      // Update the complete ordem
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      // Call the parent function to update the ordem
      await onOrdemUpdate(ordemAtualizada);
      
      // Show success message
      let statusMsg = "";
      if (status === 'concluido') statusMsg = "concluído";
      else if (status === 'pausado') statusMsg = "pausado";
      else if (status === 'em_andamento') statusMsg = "em andamento";
      else statusMsg = status;
      
      toast.success(`Serviço ${servico.tipo} ${statusMsg}`);
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
                funcionarioId={servico.funcionarioId}
                funcionarioNome={servico.funcionarioNome}
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
