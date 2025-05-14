
// Importar componentes e hooks necessários
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TipoServico } from '@/types/ordens';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SubatividadePadrao {
  id: string;
  nome: string;
  servico: TipoServico;
  tempoEstimado?: number;
}

interface SelectSubatividadesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicoTipo: TipoServico;
  onSelect: (subatividades: string[]) => void;
}

export function SelectSubatividadesDialog({
  open,
  onOpenChange,
  servicoTipo,
  onSelect
}: SelectSubatividadesDialogProps) {
  const [subatividades, setSubatividades] = useState<SubatividadePadrao[]>([]);
  const [selectedSubatividades, setSelectedSubatividades] = useState<{[id: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Função para buscar subatividades padrão do Firestore
  const fetchSubatividades = useCallback(async () => {
    if (!open) return; // Não buscar quando o diálogo não estiver aberto
    
    console.log("SelectSubatividadesDialog - Buscando subatividades para:", servicoTipo);
    setIsLoading(true);
    setError(null);
    
    try {
      // Método 1: Tentar buscar da coleção subatividades_padrao
      let q = query(
        collection(db, "subatividades_padrao"),
        where("servico", "==", servicoTipo)
      );
      
      let querySnapshot = await getDocs(q);
      let subatividadesData: SubatividadePadrao[] = [];
      
      // Se não encontrou na primeira coleção, tentar na coleção subatividades
      if (querySnapshot.empty) {
        console.log("SelectSubatividadesDialog - Nada encontrado em subatividades_padrao, tentando em subatividades");
        
        // Método 2: Buscar na coleção subatividades usando o campo tipoServico
        q = query(
          collection(db, "subatividades"),
          where("tipoServico", "==", servicoTipo)
        );
        
        querySnapshot = await getDocs(q);
        
        // Se ainda estiver vazio, tentar com o campo servicoTipo
        if (querySnapshot.empty) {
          console.log("SelectSubatividadesDialog - Nada encontrado com tipoServico, tentando com servicoTipo");
          q = query(
            collection(db, "subatividades"),
            where("servicoTipo", "==", servicoTipo)
          );
          
          querySnapshot = await getDocs(q);
        }
      }
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        subatividadesData.push({ 
          id: doc.id, 
          nome: data.nome, 
          servico: servicoTipo,
          tempoEstimado: data.tempoEstimado 
        });
      });
      
      // Se ainda não encontrou nada, usar valores padrão do sistema
      if (subatividadesData.length === 0) {
        console.log("SelectSubatividadesDialog - Nenhuma subatividade encontrada no banco, gerando padrões");
        
        // Usar os valores padrão conforme o tipo de serviço
        const defaultValues = getDefaultSubatividades(servicoTipo);
        subatividadesData = defaultValues.map((nome, index) => ({
          id: `default-${servicoTipo}-${index}`,
          nome,
          servico: servicoTipo
        }));
      }
      
      console.log("SelectSubatividadesDialog - Subatividades finais:", subatividadesData);
      setSubatividades(subatividadesData);
      
      // Limpar seleções anteriores
      setSelectedSubatividades({});
    } catch (error) {
      console.error("Erro ao buscar subatividades padrão:", error);
      setError("Erro ao carregar subatividades padrão");
    } finally {
      setIsLoading(false);
    }
  }, [servicoTipo, open]);
  
  // Carregar subatividades quando o diálogo abrir
  useEffect(() => {
    if (open) {
      console.log("SelectSubatividadesDialog - Diálogo abriu, buscando subatividades");
      fetchSubatividades();
    } else {
      // Limpar seleções quando fechar
      console.log("SelectSubatividadesDialog - Diálogo fechou, limpando seleções");
      setSelectedSubatividades({});
    }
  }, [open, fetchSubatividades]);
  
  // Manipulador para toggle de subatividades
  const handleToggleSubatividade = useCallback((id: string, checked: boolean) => {
    console.log("SelectSubatividadesDialog - Toggle subatividade:", { id, checked });
    setSelectedSubatividades(prev => ({
      ...prev,
      [id]: checked
    }));
  }, []);
  
  // Manipulador para selecionar todas as subatividades
  const handleSelectAll = useCallback(() => {
    console.log("SelectSubatividadesDialog - Selecionando todas");
    const allSelected = subatividades.reduce(
      (acc, curr) => ({ ...acc, [curr.id]: true }), 
      {}
    );
    setSelectedSubatividades(allSelected);
  }, [subatividades]);
  
  // Manipulador para limpar todas as seleções
  const handleClearAll = useCallback(() => {
    console.log("SelectSubatividadesDialog - Limpando todas as seleções");
    setSelectedSubatividades({});
  }, []);
  
  // Manipulador para aplicar seleções - MODIFICADO: agora passa IDs, não nomes
  const handleApply = useCallback(() => {
    console.log("SelectSubatividadesDialog - Aplicando seleções:", selectedSubatividades);
    
    // Pegar IDs das subatividades selecionadas (não os nomes)
    const selectedIds = Object.entries(selectedSubatividades)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => id);
    
    console.log("SelectSubatividadesDialog - IDs selecionados:", selectedIds);
    
    if (selectedIds.length === 0) {
      console.log("SelectSubatividadesDialog - Nenhuma subatividade selecionada, fechando diálogo");
      onOpenChange(false);
      return;
    }
    
    onSelect(selectedIds);
    // Deixamos o diálogo aberto até que o componente pai o feche após processar as seleções
  }, [selectedSubatividades, onSelect, onOpenChange]);
  
  // Verificar se há alguma subatividade selecionada
  const hasSelectedSubatividades = Object.values(selectedSubatividades).some(Boolean);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Subatividades</DialogTitle>
          <DialogDescription>
            Escolha as subatividades que deseja adicionar a este serviço.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-4 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Carregando subatividades...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">
              <p>{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchSubatividades} 
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : subatividades.length === 0 ? (
            <div className="text-center py-4">
              <p>Nenhuma subatividade encontrada para este serviço.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configure as subatividades padrão nas configurações.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between mb-4">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Selecionar todas
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Limpar seleção
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {subatividades.map((sub) => (
                  <div key={sub.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sub-${sub.id}`}
                      checked={selectedSubatividades[sub.id] || false}
                      onCheckedChange={(checked) => 
                        handleToggleSubatividade(sub.id, checked === true)
                      }
                    />
                    <Label htmlFor={`sub-${sub.id}`}>{sub.nome}</Label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleApply}
            disabled={isLoading || !hasSelectedSubatividades}
          >
            Adicionar Selecionadas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Função auxiliar para obter subatividades padrão por tipo de serviço
function getDefaultSubatividades(servicoTipo: TipoServico): string[] {
  switch (servicoTipo) {
    case 'bloco':
      return ["Lavagem", "Inspeção", "Análise de trincas", "Retífica", "Brunimento", "Mandrilhamento"];
    case 'biela':
      return ["Inspeção", "Alinhamento", "Troca de buchas", "Balanceamento"];
    case 'cabecote':
      return ["Lavagem", "Teste de trincas", "Plano", "Assentamento de válvulas", "Sedes", "Guias"];
    case 'virabrequim':
      return ["Inspeção", "Retífica", "Polimento", "Balanceamento"];
    case 'eixo_comando':
      return ["Inspeção", "Retífica", "Balanceamento"];
    case 'montagem':
      return ["Preparação", "Montagem do cabeçote", "Montagem do bloco", "Ajustes finais", "Testes"];
    case 'dinamometro':
      return ["Potência", "Torque", "Consumo", "Análise"];
    case 'lavagem':
      return ["Preparação", "Lavagem química", "Lavagem externa", "Secagem"];
    case 'inspecao_inicial':
      return ["Verificação de trincas", "Medição de componentes", "Verificação dimensional"];
    case 'inspecao_final':
      return ["Verificação visual", "Teste de qualidade", "Conformidade com especificações"];
    default:
      return ["Preparação", "Execução", "Finalização"];
  }
}
