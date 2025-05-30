
import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { OrdemServico } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleFuncionarioSelector } from "@/components/funcionarios/SimpleFuncionarioSelector";
import { 
  marcarFuncionarioEmServico, 
  liberarFuncionarioDeServico,
  diagnosticarStatusFuncionario,
  forcarLiberacaoFuncionario
} from "@/services/funcionarioEmServicoService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import useFuncionariosDisponibilidade from "@/hooks/useFuncionariosDisponibilidade";

type AtribuicaoFuncionariosTabProps = {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
};

// Type guard para verificar se é um erro
const isErro = (diagnostico: any): diagnostico is { erro: string } => {
  return diagnostico && 'erro' in diagnostico;
};

export function AtribuicaoFuncionariosTab({ ordem, onOrdemUpdate }: AtribuicaoFuncionariosTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticandoFuncionarios, setDiagnosticandoFuncionarios] = useState<string[]>([]);
  const { funcionariosDisponiveis, funcionariosOcupados } = useFuncionariosDisponibilidade();

  // Função para diagnosticar status de um funcionário específico
  const handleDiagnosticarFuncionario = async (funcionarioId: string) => {
    if (!funcionarioId) return;
    
    setDiagnosticandoFuncionarios(prev => [...prev, funcionarioId]);
    
    try {
      const diagnostico = await diagnosticarStatusFuncionario(funcionarioId);
      
      if (isErro(diagnostico)) {
        toast.error(`Erro no diagnóstico: ${diagnostico.erro}`);
        return;
      }
      
      // Mostrar resultado do diagnóstico
      if (diagnostico.inconsistente) {
        toast.warning(
          `Dados inconsistentes detectados! Funcionário está marcado como ocupado mas a ordem não existe.`,
          {
            duration: 8000,
            action: {
              label: "Liberar Automaticamente",
              onClick: () => forcarLiberacaoFuncionario(funcionarioId)
            }
          }
        );
      } else {
        toast.success("Status do funcionário está consistente");
      }
      
      console.log("📋 Diagnóstico do funcionário:", diagnostico);
    } catch (error) {
      toast.error("Erro ao diagnosticar funcionário");
      console.error("Erro no diagnóstico:", error);
    } finally {
      setDiagnosticandoFuncionarios(prev => prev.filter(id => id !== funcionarioId));
    }
  };

  const handleFuncionarioChange = async (servicoTipo: string, funcionarioId: string, funcionarioNome: string) => {
    try {
      setIsSubmitting(true);
      
      const servico = ordem.servicos.find(s => s.tipo === servicoTipo);
      const funcionarioAnteriorId = servico?.funcionarioId;
      
      console.log("Mudança de funcionário:", {
        servicoTipo,
        funcionarioAnterior: funcionarioAnteriorId,
        novoFuncionario: funcionarioId,
        novoFuncionarioNome: funcionarioNome,
        statusAtual: servico?.status
      });
      
      // Liberar funcionário anterior se existir
      if (funcionarioAnteriorId && funcionarioAnteriorId !== funcionarioId) {
        console.log("Liberando funcionário anterior...");
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
      console.log("Atualizando serviços no Firestore...");
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        servicos: updatedServicos
      });
      console.log("✅ Serviços atualizados no Firestore");
      
      // Se o serviço já está em andamento, marcar novo funcionário como ocupado
      if (servico?.status === 'em_andamento') {
        console.log("Serviço já está em andamento, marcando novo funcionário como ocupado...");
        const success = await marcarFuncionarioEmServico(
          funcionarioId,
          ordem.id,
          'retifica', // Usar etapa padrão para serviços
          servico?.tipo
        );
        
        if (!success) {
          toast.warning("Funcionário atribuído mas não foi possível marcá-lo como ocupado. O serviço foi pausado.");
          // Pausar o serviço se não conseguir marcar funcionário como ocupado
          const servicosPausados = updatedServicos.map(s => 
            s.tipo === servicoTipo ? { ...s, status: 'pausado' as const } : s
          );
          await updateDoc(ordemRef, { servicos: servicosPausados });
          if (onOrdemUpdate) {
            onOrdemUpdate({ ...ordem, servicos: servicosPausados });
          }
          return;
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
    <TabsContent value="atribuicao-funcionarios" className="space-y-4 py-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Atribuição de Funcionários</h2>
        <p className="text-muted-foreground">Gerencie os funcionários responsáveis por cada serviço</p>
        
        {/* Resumo da disponibilidade */}
        <div className="flex gap-4 mt-4">
          <Badge variant="success" className="text-sm">
            {funcionariosDisponiveis.length} funcionários disponíveis
          </Badge>
          <Badge variant="warning" className="text-sm">
            {funcionariosOcupados.length} funcionários ocupados
          </Badge>
        </div>
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
                  <Badge variant={servico.status === 'concluido' ? 'success' : 'outline'} className="text-sm">
                    {servico.funcionarioNome ? `${servico.funcionarioNome}` : 'Sem funcionário'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Funcionário Responsável */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SimpleFuncionarioSelector
                      label="Funcionário Responsável"
                      especialidadeRequerida={servico.tipo}
                      funcionarioAtualId={servico.funcionarioId}
                      funcionarioAtualNome={servico.funcionarioNome}
                      onFuncionarioSelecionado={(id, nome) => handleFuncionarioChange(servico.tipo, id, nome)}
                      mostrarCancelar={false}
                      disabled={isSubmitting}
                    />
                    
                    {/* Botões de diagnóstico e liberação */}
                    {servico.funcionarioId && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDiagnosticarFuncionario(servico.funcionarioId!)}
                          disabled={diagnosticandoFuncionarios.includes(servico.funcionarioId!)}
                          className="text-xs"
                        >
                          {diagnosticandoFuncionarios.includes(servico.funcionarioId!) ? "Verificando..." : "Diagnosticar"}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => forcarLiberacaoFuncionario(servico.funcionarioId!)}
                          className="text-xs"
                        >
                          Liberar
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {!servico.funcionarioId && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Atribua um funcionário para este serviço
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
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
