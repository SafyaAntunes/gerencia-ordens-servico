
import { useCallback, useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { OrdemServico, Servico, ServicoStatus } from "@/types/ordens";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SimpleFuncionarioSelector } from "@/components/funcionarios/SimpleFuncionarioSelector";
import { marcarFuncionarioEmServico, liberarFuncionarioDeServico } from "@/services/funcionarioEmServicoService";

type ServicoControlTabProps = {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
};

const getStatusBadgeVariant = (status: ServicoStatus) => {
  switch (status) {
    case 'nao_iniciado': return 'outline';
    case 'em_andamento': return 'default';
    case 'pausado': return 'warning';
    case 'concluido': return 'success';
    default: return 'outline';
  }
};

const getStatusLabel = (status: ServicoStatus) => {
  switch (status) {
    case 'nao_iniciado': return 'Não Iniciado';
    case 'em_andamento': return 'Em Andamento';
    case 'pausado': return 'Pausado';
    case 'concluido': return 'Concluído';
    default: return 'Não Iniciado';
  }
};

const getStatusButtonStyle = (currentStatus: ServicoStatus, buttonStatus: ServicoStatus) => {
  if (currentStatus === buttonStatus) {
    switch (buttonStatus) {
      case 'em_andamento':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'pausado':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'concluido':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return '';
    }
  }
  return '';
};

export function ServicoControlTab({ ordem, onOrdemUpdate }: ServicoControlTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (servicoTipo: string, newStatus: ServicoStatus) => {
    try {
      setIsSubmitting(true);
      
      const servico = ordem.servicos.find(s => s.tipo === servicoTipo);
      const funcionarioId = servico?.funcionarioId;
      
      // Gerenciar status do funcionário baseado no novo status do serviço
      if (funcionarioId) {
        if (newStatus === 'em_andamento') {
          // Marcar funcionário como ocupado
          const success = await marcarFuncionarioEmServico(
            funcionarioId,
            ordem.id,
            'retifica', // Usar etapa padrão para serviços
            servico?.tipo
          );
          
          if (!success) {
            toast.error("Funcionário não pode ser marcado como ocupado");
            return;
          }
        } else if (newStatus === 'pausado' || newStatus === 'concluido') {
          // Liberar funcionário
          await liberarFuncionarioDeServico(funcionarioId);
        }
      }
      
      // Update the service status in the ordem
      const updatedServicos = ordem.servicos.map(servico => 
        servico.tipo === servicoTipo 
          ? { 
              ...servico, 
              status: newStatus,
              concluido: newStatus === 'concluido'
            }
          : servico
      );

      // Update in Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        servicos: updatedServicos
      });
      
      // Update local state
      if (onOrdemUpdate) {
        onOrdemUpdate({
          ...ordem,
          servicos: updatedServicos
        });
      }
      
      toast.success(`Status do serviço ${servicoTipo} atualizado para ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFuncionarioChange = async (servicoTipo: string, funcionarioId: string, funcionarioNome: string) => {
    try {
      setIsSubmitting(true);
      
      const servico = ordem.servicos.find(s => s.tipo === servicoTipo);
      const funcionarioAnteriorId = servico?.funcionarioId;
      
      // Liberar funcionário anterior se existir
      if (funcionarioAnteriorId && funcionarioAnteriorId !== funcionarioId) {
        await liberarFuncionarioDeServico(funcionarioAnteriorId);
      }
      
      // Update the service funcionario in the ordem
      const updatedServicos = ordem.servicos.map(servico => 
        servico.tipo === servicoTipo 
          ? { 
              ...servico, 
              funcionarioId,
              funcionarioNome
            }
          : servico
      );

      // Update in Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        servicos: updatedServicos
      });
      
      // Se o serviço já está em andamento, marcar novo funcionário como ocupado
      if (servico?.status === 'em_andamento') {
        const success = await marcarFuncionarioEmServico(
          funcionarioId,
          ordem.id,
          'retifica', // Usar etapa padrão para serviços
          servico?.tipo
        );
        
        if (!success) {
          toast.warning("Funcionário atribuído mas não foi possível marcá-lo como ocupado");
        }
      }
      
      // Update local state
      if (onOrdemUpdate) {
        onOrdemUpdate({
          ...ordem,
          servicos: updatedServicos
        });
      }
      
      toast.success(`Funcionário ${funcionarioNome} atribuído ao serviço ${servicoTipo}`);
    } catch (error) {
      console.error("Erro ao atualizar funcionário do serviço:", error);
      toast.error("Erro ao atualizar funcionário do serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TabsContent value="controle-servicos" className="space-y-4 py-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Controle de Serviços</h2>
        <p className="text-muted-foreground">Gerencie os funcionários responsáveis e status de cada serviço</p>
      </div>
      
      {ordem.servicos && ordem.servicos.length > 0 ? (
        <div className="space-y-6">
          {ordem.servicos.map((servico, index) => (
            <Card key={`${servico.tipo}-${index}`} className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl capitalize mb-2">
                      {servico.tipo.replace('_', ' ')}
                    </CardTitle>
                    {servico.descricao && (
                      <p className="text-sm text-muted-foreground">
                        {servico.descricao}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(servico.status || 'nao_iniciado')} className="text-sm">
                    {getStatusLabel(servico.status || 'nao_iniciado')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Funcionário Responsável */}
                <div className="space-y-2">
                  <SimpleFuncionarioSelector
                    label="Funcionário Responsável"
                    especialidadeRequerida={servico.tipo}
                    funcionarioAtualId={servico.funcionarioId}
                    funcionarioAtualNome={servico.funcionarioNome}
                    onFuncionarioSelecionado={(id, nome) => handleFuncionarioChange(servico.tipo, id, nome)}
                    mostrarCancelar={false}
                  />
                </div>

                {/* Botões de Status */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Status do Serviço</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'nao_iniciado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'nao_iniciado')}
                      disabled={isSubmitting}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'nao_iniciado')}`}
                    >
                      Não Iniciado
                    </Button>
                    
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'em_andamento' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'em_andamento')}
                      disabled={isSubmitting || !servico.funcionarioId}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'em_andamento')}`}
                    >
                      Em Andamento
                    </Button>
                    
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'pausado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'pausado')}
                      disabled={isSubmitting}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'pausado')}`}
                    >
                      Pausado
                    </Button>
                    
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'concluido' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'concluido')}
                      disabled={isSubmitting}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'concluido')}`}
                    >
                      Finalizado
                    </Button>
                  </div>
                  
                  {!servico.funcionarioId && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Atribua um funcionário antes de iniciar o serviço
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-600 mb-4">Esta ordem não possui serviços configurados.</p>
              <p className="text-sm text-gray-500">
                Para adicionar serviços, edite a ordem e selecione os serviços desejados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
