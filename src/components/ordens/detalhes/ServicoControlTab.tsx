
import { useCallback, useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { OrdemServico, Servico, SubAtividade, TipoServico } from "@/types/ordens";
import { ServicoControl } from "@/components/ordens/servico/ServicoControl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ServicoControlTabProps = {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
};

export function ServicoControlTab({ ordem, onOrdemUpdate }: ServicoControlTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState<string>("");
  const [funcionarioNome, setFuncionarioNome] = useState<string>("");

  const form = useForm();

  useEffect(() => {
    // Initialize form with servicos subatividades
    if (ordem.servicos) {
      const servicosSubatividades = ordem.servicos.reduce((acc: any, servico) => {
        acc[servico.tipo] = servico.subatividades || [];
        return acc;
      }, {});

      form.setValue("servicosSubatividades", servicosSubatividades);

      // Initialize servicosDescricoes
      const servicosDescricoes = ordem.servicos.reduce((acc: any, servico) => {
        acc[servico.tipo] = servico.descricao || '';
        return acc;
      }, {});

      form.setValue("servicosDescricoes", servicosDescricoes);
    }
  }, [ordem, form]);

  const handleSubatividadeToggle = useCallback((servicoTipo: string, subatividadeId: string, checked: boolean) => {
    const servicosSubatividades = form.getValues("servicosSubatividades") || {};
    const subatividades = servicosSubatividades[servicoTipo] || [];
    
    const updatedSubatividades = subatividades.map((sub: any) => 
      sub.id === subatividadeId ? { ...sub, selecionada: checked } : sub
    );
    
    form.setValue("servicosSubatividades", { 
      ...servicosSubatividades, 
      [servicoTipo]: updatedSubatividades 
    });
  }, [form]);

  const handleAtividadeEspecificaToggle = useCallback((servicoTipo: string, tipoAtividade: string, subatividadeId: string, checked: boolean) => {
    const atividadesEspecificas = form.getValues("atividadesEspecificas") || {};
    const atividadesDoServico = atividadesEspecificas[servicoTipo] || {};
    const atividadesTipo = atividadesDoServico[tipoAtividade] || [];
    
    const updatedAtividades = atividadesTipo.map((ativ: any) => 
      ativ.id === subatividadeId ? { ...ativ, selecionada: checked } : ativ
    );
    
    form.setValue("atividadesEspecificas", {
      ...atividadesEspecificas,
      [servicoTipo]: {
        ...atividadesDoServico,
        [tipoAtividade]: updatedAtividades
      }
    });
  }, [form]);

  const handleStatusChange = useCallback(async (status: string, funcId: string, funcNome: string) => {
    try {
      setIsSubmitting(true);
      
      // Update the status in Firestore
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        status: status
      });
      
      // If the callback is provided, update the local state
      if (onOrdemUpdate) {
        onOrdemUpdate({
          ...ordem,
          status: status as any
        });
      }
      
      toast.success("Status da ordem atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da ordem");
    } finally {
      setIsSubmitting(false);
    }
  }, [ordem, onOrdemUpdate]);

  return (
    <TabsContent value="servicos" className="space-y-4 py-4">
      <h2 className="text-xl font-semibold">Serviços da Ordem</h2>
      
      {ordem.servicos.length > 0 ? (
        <div className="space-y-6">
          {ordem.servicos.map((servico) => {
            return (
              <div key={servico.tipo} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{servico.tipo}</h3>
                  <Badge variant={servico.concluido ? "success" : "default"}>
                    {servico.concluido ? "Concluído" : "Em andamento"}
                  </Badge>
                </div>
                
                {/* Pass the necessary props to ServicoControl */}
                <ServicoControl
                  key={servico.tipo}
                  tipo={servico.tipo}
                  form={form}
                  handleSubatividadeToggle={handleSubatividadeToggle}
                  handleAtividadeEspecificaToggle={handleAtividadeEspecificaToggle}
                  descricao={servico.descricao}
                  subatividades={servico.subatividades || []}
                />
                
                <Separator className="my-4" />
              </div>
            );
          })}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => handleStatusChange("autorizado", funcionarioId, funcionarioNome)}
              disabled={isSubmitting}
            >
              Autorizar Serviços
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Nenhum serviço encontrado para esta ordem.</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
