
import { useState, useEffect } from "react";
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
  
  // Obter as subatividades padrão caso não haja nenhuma no banco
  const { defaultSubatividades } = useServicoSubatividades();

  useEffect(() => {
    if (open && servicoTipo) {
      setIsLoading(true);
      
      // Buscar subatividades do banco de dados para este tipo de serviço
      getSubatividadesByTipo(servicoTipo)
        .then((subatividades) => {
          console.log(`Subatividades carregadas do banco para ${servicoTipo}:`, subatividades);
          
          if (subatividades.length === 0) {
            // Se não houver subatividades no banco, usar as padrão
            const subatividadesPadrao = defaultSubatividades[servicoTipo] || [];
            console.log("Usando subatividades padrão:", subatividadesPadrao);
            
            // Converter strings para objetos SubAtividade
            const subatividadesObjetos = subatividadesPadrao.map((nome, index) => ({
              id: `default-${index}`,
              nome,
              selecionada: false,
              tempoEstimado: 1
            }));
            
            setSubatividadesDisponiveis(subatividadesObjetos);
          } else {
            setSubatividadesDisponiveis(subatividades);
          }
          
          // Inicializar todas como selecionadas
          const inicial: Record<string, boolean> = {};
          const subs = subatividades.length > 0 ? subatividades : defaultSubatividades[servicoTipo]?.map((nome, index) => ({
            id: `default-${index}`,
            nome,
            selecionada: false,
            tempoEstimado: 1
          })) || [];
          
          subs.forEach(sub => {
            inicial[sub.nome] = true;
          });
          
          setSelecionadas(inicial);
          setIsLoading(false);
        })
        .catch(error => {
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
          setIsLoading(false);
        });
    }
  }, [open, servicoTipo, defaultSubatividades]);

  const handleToggleSubatividade = (nome: string, checked: boolean) => {
    setSelecionadas(prev => ({
      ...prev,
      [nome]: checked
    }));
  };

  const handleSelectAll = () => {
    const todas: Record<string, boolean> = {};
    subatividadesDisponiveis.forEach(sub => {
      todas[sub.nome] = true;
    });
    setSelecionadas(todas);
  };

  const handleDeselectAll = () => {
    const nenhuma: Record<string, boolean> = {};
    subatividadesDisponiveis.forEach(sub => {
      nenhuma[sub.nome] = false;
    });
    setSelecionadas(nenhuma);
  };

  const handleConfirm = () => {
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
  };

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
