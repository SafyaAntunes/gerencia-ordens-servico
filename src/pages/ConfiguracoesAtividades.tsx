
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useConfiguracoesServico } from "@/hooks/useConfiguracoesServico";
import { TipoAtividade, TipoServico } from "@/types/ordens";
import ConfiguracaoAtividadesTabela from "@/components/configuracao/ConfiguracaoAtividadesTabela";
import { toast } from "sonner";

interface ConfiguracoesAtividadesProps {
  onLogout?: () => void;
  isEmbedded?: boolean;
  tipoAtividade: TipoAtividade;
  titulo: string;
  descricao: string;
}

export default function ConfiguracoesAtividades({
  onLogout,
  isEmbedded = false,
  tipoAtividade,
  titulo,
  descricao,
}: ConfiguracoesAtividadesProps) {
  const { itens, isLoading, isSaving, atualizarItem, salvarConfiguracoes } = useConfiguracoesServico(tipoAtividade);
  const [itemToDelete, setItemToDelete] = useState<TipoServico | null>(null);

  const handleSave = async () => {
    const sucesso = await salvarConfiguracoes();
    if (sucesso) {
      toast.success(`Configurações de ${formatarTipoAtividade(tipoAtividade)} salvas com sucesso`);
    }
  };

  const handleEditItem = (item: any) => {
    // Esta função é um placeholder para futura funcionalidade de edição
    toast.info(`Edição de ${item.nome} ainda não implementada`);
  };

  const handleDeleteItem = (tipo: TipoServico) => {
    setItemToDelete(tipo);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      // Esta função é um placeholder para futura funcionalidade de exclusão
      toast.info(`Exclusão de item ainda não implementada`);
      setItemToDelete(null);
    }
  };

  const formatarTipoAtividade = (tipo: TipoAtividade): string => {
    switch (tipo) {
      case 'lavagem': return 'Lavagem';
      case 'inspecao_inicial': return 'Inspeção Inicial';
      case 'inspecao_final': return 'Inspeção Final';
      default: return tipo;
    }
  };

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="ml-auto"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <ConfiguracaoAtividadesTabela
              tipoAtividade={tipoAtividade}
              titulo={`Configuração de ${formatarTipoAtividade(tipoAtividade)}`}
              descricao={`Configure os tempos padrão para ${formatarTipoAtividade(tipoAtividade)}`}
              itens={itens}
              onItemChange={atualizarItem}
              onItemEdit={handleEditItem}
              onItemDelete={handleDeleteItem}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta configuração? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return <Layout onLogout={onLogout}>{content}</Layout>;
}
