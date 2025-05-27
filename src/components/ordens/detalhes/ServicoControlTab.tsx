
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

export function ServicoControlTab({ ordem, onOrdemUpdate }: ServicoControlTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (servicoTipo: string, newStatus: ServicoStatus) => {
    try {
      setIsSubmitting(true);
      
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
    <TabsContent value="servicos" className="space-y-4 py-4">
      <h2 className="text-xl font-semibold">Controle de Serviços</h2>
      
      {ordem.servicos && ordem.servicos.length > 0 ? (
        <div className="space-y-4">
          {ordem.servicos.map((servico, index) => (
            <Card key={`${servico.tipo}-${index}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg capitalize">
                    {servico.tipo.replace('_', ' ')}
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(servico.status || 'nao_iniciado')}>
                    {getStatusLabel(servico.status || 'nao_iniciado')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Funcionário Responsável */}
                <div>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status do Serviço</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'nao_iniciado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'nao_iniciado')}
                      disabled={isSubmitting}
                    >
                      Não Iniciado
                    </Button>
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'em_andamento' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'em_andamento')}
                      disabled={isSubmitting}
                      className={(servico.status || 'nao_iniciado') === 'em_andamento' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    >
                      Em Andamento
                    </Button>
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'pausado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'pausado')}
                      disabled={isSubmitting}
                      className={(servico.status || 'nao_iniciado') === 'pausado' ? 'bg-orange-400 hover:bg-orange-500' : ''}
                    >
                      Pausado
                    </Button>
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'concluido' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'concluido')}
                      disabled={isSubmitting}
                      className={(servico.status || 'nao_iniciado') === 'concluido' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      Concluído
                    </Button>
                  </div>
                </div>

                {/* Descrição do Serviço (se houver) */}
                {servico.descricao && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Descrição:</strong> {servico.descricao}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum serviço encontrado para esta ordem.</p>
              <p className="text-sm text-muted-foreground">
                Para adicionar serviços, edite a ordem e selecione os serviços desejados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
