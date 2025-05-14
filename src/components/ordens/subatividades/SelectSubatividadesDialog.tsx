
import { useState, useEffect, useCallback, useRef } from "react";
import { TipoServico, SubAtividade } from "@/types/ordens";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { getSubatividadesByTipo } from "@/services/subatividadeService";
import { Loader2 } from "lucide-react";
import { useServicoSubatividades } from "@/hooks/useServicoSubatividades";
import { toast } from "sonner";

interface SelectSubatividadesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicoTipo: TipoServico;
  onSelect: (selecionadas: string[]) => void;
}

export function SelectSubatividadesDialog({
  open,
  onOpenChange,
  servicoTipo,
  onSelect,
}: SelectSubatividadesDialogProps) {
  const [subatividadesDisponiveis, setSubatividadesDisponiveis] = useState<SubAtividade[]>([]);
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  
  // Obter as subatividades padrão caso não haja nenhuma no banco
  const { defaultSubatividades } = useServicoSubatividades();
  const previousOpenState = useRef(open);
  const shouldFetch = useRef(false);

  // Controle de efeitos para evitar re-renders desnecessários
  useEffect(() => {
    // Resetamos as subatividades ao fechar o diálogo
    if (!open && previousOpenState.current) {
      console.log("Dialog fechou, resetando estado interno");
      setIsDataFetched(false);
      shouldFetch.current = false;
    }
    
    // Se o diálogo foi aberto e ainda não buscamos os dados
    if (open && !previousOpenState.current) {
      console.log("Dialog abriu, preparando para buscar dados");
      setIsDataFetched(false);
      shouldFetch.current = true;
    }
    
    previousOpenState.current = open;
  }, [open]);

  // Efeito separado para carregar dados apenas quando necessário
  useEffect(() => {
    if (!open || !shouldFetch.current || servicoTipo === undefined || isDataFetched) {
      return;
    }
    
    console.log(`Buscando subatividades para ${servicoTipo}, shouldFetch=${shouldFetch.current}, isDataFetched=${isDataFetched}`);
    
    const loadSubatividades = async () => {
      setIsLoading(true);
      try {
        // Buscar subatividades do banco de dados para este tipo de serviço
        const subatividades = await getSubatividadesByTipo(servicoTipo);
        console.log(`Subatividades carregadas do banco para ${servicoTipo}:`, subatividades);
        
        let subatividadesFinais: SubAtividade[] = [];
        
        if (subatividades.length === 0) {
          // Se não houver subatividades no banco, usar as padrão
          const subatividadesPadrao = defaultSubatividades[servicoTipo] || [];
          console.log("Usando subatividades padrão:", subatividadesPadrao);
          
          // Converter strings para objetos SubAtividade
          subatividadesFinais = subatividadesPadrao.map((nome, index) => ({
            id: `default-${index}`,
            nome,
            selecionada: false,
            tempoEstimado: 1
          }));
        } else {
          subatividadesFinais = subatividades;
        }
        
        setSubatividadesDisponiveis(subatividadesFinais);
        
        // Inicializar todas como selecionadas
        const inicial: Record<string, boolean> = {};
        subatividadesFinais.forEach(sub => {
          inicial[sub.nome] = true;
        });
        
        setSelecionadas(inicial);
        setIsDataFetched(true);
        shouldFetch.current = false;
      } catch (error) {
        console.error("Erro ao buscar subatividades:", error);
        toast.error("Erro ao carregar subatividades");
        
        // Em caso de erro, tentar usar as padrão
        const subatividadesPadrao = defaultSubatividades[servicoTipo] || [];
        const subatividadesObjetos = subatividadesPadrao.map((nome, index) => ({
          id: `default-${index}`,
          nome,
          selecionada: false,
          tempoEstimado: 1
        }));
        
        setSubatividadesDisponiveis(subatividadesObjetos);
        
        const inicial: Record<string, boolean> = {};
        subatividadesPadrao.forEach(nome => {
          inicial[nome] = true;
        });
        
        setSelecionadas(inicial);
        setIsDataFetched(true);
        shouldFetch.current = false;
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSubatividades();
  }, [servicoTipo, open, defaultSubatividades, isDataFetched]);

  const handleToggleSubatividade = useCallback((nome: string, checked: boolean) => {
    setSelecionadas(prev => ({
      ...prev,
      [nome]: checked
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    const todas: Record<string, boolean> = {};
    subatividadesDisponiveis.forEach(sub => {
      todas[sub.nome] = true;
    });
    setSelecionadas(todas);
  }, [subatividadesDisponiveis]);

  const handleDeselectAll = useCallback(() => {
    const nenhuma: Record<string, boolean> = {};
    subatividadesDisponiveis.forEach(sub => {
      nenhuma[sub.nome] = false;
    });
    setSelecionadas(nenhuma);
  }, [subatividadesDisponiveis]);

  const handleConfirm = useCallback(() => {
    // Filtrar apenas as subatividades selecionadas
    const subatividadesSelecionadas = Object.entries(selecionadas)
      .filter(([_, selecionada]) => selecionada)
      .map(([nome]) => nome);
    
    console.log("Subatividades selecionadas para adicionar:", subatividadesSelecionadas);
    
    if (subatividadesSelecionadas.length === 0) {
      toast.warning("Nenhuma subatividade selecionada");
      return;
    }
    
    onSelect(subatividadesSelecionadas);
    onOpenChange(false);
  }, [selecionadas, onSelect, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Subatividades</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex justify-between mb-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Selecionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Desmarcar Todas
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : subatividadesDisponiveis.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma subatividade configurada para este tipo de serviço.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
              {subatividadesDisponiveis.map((subatividade) => (
                <div key={subatividade.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`sub-${subatividade.id}`} 
                    checked={selecionadas[subatividade.nome]} 
                    onCheckedChange={(checked) => handleToggleSubatividade(subatividade.nome, !!checked)}
                  />
                  <Label htmlFor={`sub-${subatividade.id}`} className="text-sm">
                    {subatividade.nome}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading || Object.values(selecionadas).every(sel => !sel)}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
