
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { v4 as uuidv4 } from "uuid";
import { formatCurrency } from "@/lib/utils";

const formatTipoServico = (tipo: TipoServico): string => {
  const labels: Record<TipoServico, string> = {
    bloco: "Bloco",
    biela: "Biela",
    cabecote: "Cabeçote",
    virabrequim: "Virabrequim",
    eixo_comando: "Eixo de Comando",
    montagem: "Montagem",
    dinamometro: "Dinamômetro",
    lavagem: "Lavagem"
  };
  return labels[tipo] || tipo;
};

export default function SubatividadesServico() {
  const { ordemId, tipoServico } = useParams<{ ordemId: string; tipoServico: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [subatividadesDisponiveis, setSubatividadesDisponiveis] = useState<SubAtividade[]>([]);
  const [subatividadesSelecionadas, setSubatividadesSelecionadas] = useState<SubAtividade[]>([]);
  const [nomeOrdem, setNomeOrdem] = useState<string>("");
  
  const tipoServicoFormatado = formatTipoServico(tipoServico as TipoServico);

  useEffect(() => {
    if (!ordemId || !tipoServico) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar dados da ordem para obter subatividades já associadas
        const ordemRef = doc(db, "ordens", ordemId);
        const ordemDoc = await getDoc(ordemRef);
        
        if (!ordemDoc.exists()) {
          toast.error("Ordem não encontrada");
          navigate("/ordens");
          return;
        }
        
        const ordemData = ordemDoc.data();
        setNomeOrdem(ordemData.nome || "");
        
        // Encontrar o serviço específico
        const servico = ordemData.servicos?.find((s: any) => s.tipo === tipoServico);
        if (!servico) {
          toast.error(`Serviço de tipo ${tipoServicoFormatado} não encontrado nesta ordem`);
          navigate(`/ordens/${ordemId}`);
          return;
        }
        
        // Buscar todas as subatividades disponíveis para este tipo de serviço
        const todasSubatividades = await getSubatividadesByTipo(tipoServico as TipoServico);
        setSubatividadesDisponiveis(todasSubatividades);
        
        // Identificar quais já estão selecionadas na ordem
        const subatividadesJaSelecionadas = servico.subatividades || [];
        setSubatividadesSelecionadas(subatividadesJaSelecionadas);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [ordemId, tipoServico, navigate, tipoServicoFormatado]);

  const handleToggleSubatividade = (subatividade: SubAtividade) => {
    // Verificar se a subatividade já está selecionada
    const index = subatividadesSelecionadas.findIndex(s => s.id === subatividade.id);
    
    if (index >= 0) {
      // Se já existe, remover
      setSubatividadesSelecionadas(prev => 
        prev.filter(s => s.id !== subatividade.id)
      );
    } else {
      // Se não existe, adicionar
      setSubatividadesSelecionadas(prev => [
        ...prev, 
        { 
          ...subatividade,
          selecionada: true,
          concluida: false
        }
      ]);
    }
  };

  const handleSalvar = async () => {
    if (!ordemId || !tipoServico) return;
    
    try {
      const ordemRef = doc(db, "ordens", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem não encontrada");
        return;
      }
      
      const ordemData = ordemDoc.data();
      
      // Atualizar o array de serviços com as novas subatividades
      const servicos = ordemData.servicos.map((servico: any) => {
        if (servico.tipo === tipoServico) {
          return {
            ...servico,
            subatividades: subatividadesSelecionadas.map(sub => ({
              ...sub,
              selecionada: true
            }))
          };
        }
        return servico;
      });
      
      // Calcular novo custo estimado de mão de obra
      let custoEstimadoMaoDeObra = 0;
      
      servicos.forEach((servico: any) => {
        if (servico.subatividades && servico.subatividades.length > 0) {
          servico.subatividades.forEach((sub: SubAtividade) => {
            if (sub.precoHora && sub.tempoEstimado) {
              custoEstimadoMaoDeObra += sub.precoHora * sub.tempoEstimado;
            }
          });
        }
      });
      
      await updateDoc(ordemRef, { 
        servicos,
        custoEstimadoMaoDeObra
      });
      
      toast.success("Subatividades atualizadas com sucesso");
      navigate(`/ordens/${ordemId}`);
    } catch (error) {
      console.error("Erro ao salvar subatividades:", error);
      toast.error("Erro ao salvar subatividades");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/ordens/${ordemId}`)}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para ordem
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Subatividades - {tipoServicoFormatado}
            </h1>
            <p className="text-muted-foreground mt-1">
              Ordem #{ordemId?.slice(-5)} - {nomeOrdem}
            </p>
          </div>
          <Button onClick={handleSalvar}>
            Salvar Alterações
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Selecione as subatividades para este serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {subatividadesDisponiveis.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                Não há subatividades cadastradas para este tipo de serviço.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate("/subatividades")}
              >
                Ir para Cadastro de Subatividades
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subatividadesDisponiveis.map((subatividade) => {
                const isSelected = subatividadesSelecionadas.some(s => s.id === subatividade.id);
                
                return (
                  <div key={subatividade.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                    <Checkbox 
                      id={`check-${subatividade.id}`} 
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSubatividade(subatividade)}
                    />
                    <div className="flex flex-1 justify-between items-center">
                      <Label 
                        htmlFor={`check-${subatividade.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {subatividade.nome}
                      </Label>
                      <div className="flex items-center space-x-4">
                        {subatividade.tempoEstimado && (
                          <span className="text-sm text-muted-foreground">
                            {subatividade.tempoEstimado} {subatividade.tempoEstimado === 1 ? 'hora' : 'horas'}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(subatividade.precoHora || 0)}/hora
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
