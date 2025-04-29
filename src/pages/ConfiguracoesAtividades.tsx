
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useConfiguracoesServico } from "@/hooks/useConfiguracoesServico";
import { TipoAtividade } from "@/types/ordens";
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

  const handleSave = async () => {
    const sucesso = await salvarConfiguracoes();
    if (sucesso) {
      toast.success(`Configurações de ${formatarTipoAtividade(tipoAtividade)} salvas com sucesso`);
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
              descricao={`Configure os valores e tempos padrão para ${formatarTipoAtividade(tipoAtividade)}`}
              itens={itens}
              onItemChange={atualizarItem}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return <Layout onLogout={onLogout}>{content}</Layout>;
}
