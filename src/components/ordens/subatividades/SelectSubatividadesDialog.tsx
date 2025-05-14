
// Importar componentes e hooks necessários
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TipoServico } from '@/types/ordens';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
      // Buscar subatividades específicas para este tipo de serviço
      const q = query(
        collection(db, "subatividades_padrao"),
        where("servico", "==", servicoTipo)
      );
      
      const querySnapshot = await getDocs(q);
      const subatividadesData: SubatividadePadrao[] = [];
      
      querySnapshot.forEach((doc) => {
        subatividadesData.push({ 
          id: doc.id, 
          ...doc.data() 
        } as SubatividadePadrao);
      });
      
      console.log("SelectSubatividadesDialog - Subatividades encontradas:", subatividadesData);
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
  
  // Manipulador para aplicar seleções
  const handleApply = useCallback(() => {
    console.log("SelectSubatividadesDialog - Aplicando seleções:", selectedSubatividades);
    
    const selectedNames = Object.entries(selectedSubatividades)
      .filter(([_, isSelected]) => isSelected)
      .map(([id, _]) => {
        const sub = subatividades.find(s => s.id === id);
        return sub ? sub.nome : "";
      })
      .filter(name => name !== "");
    
    console.log("SelectSubatividadesDialog - Nomes selecionados:", selectedNames);
    
    if (selectedNames.length === 0) {
      console.log("SelectSubatividadesDialog - Nenhuma subatividade selecionada, fechando diálogo");
      onOpenChange(false);
      return;
    }
    
    onSelect(selectedNames);
    // Não fechamos o diálogo aqui, deixamos que o componente pai cuide de fechá-lo
    // depois de processar as seleções
  }, [selectedSubatividades, subatividades, onSelect, onOpenChange]);
  
  // Verificar se há alguma subatividade selecionada
  const hasSelectedSubatividades = Object.values(selectedSubatividades).some(Boolean);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Subatividades</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-4">
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
