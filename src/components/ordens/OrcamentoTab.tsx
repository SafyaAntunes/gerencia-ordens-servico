
import React, { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OrdemServico, Servico, TABELA_PRECOS_PADRAO, SubAtividade } from "@/types/ordens";
import { Check, DollarSign, Pencil, PercentIcon, FileSpreadsheet } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface OrcamentoTabProps {
  ordem: OrdemServico;
  onOrdemUpdate: (ordem: OrdemServico) => void;
}

const formSchema = z.object({
  custoTotal: z.coerce.number().min(0, "Valor inválido"),
  precoTotal: z.coerce.number().min(0, "Valor inválido"),
  formaPagamento: z.enum(["dinheiro", "cartao", "pix", "boleto", "transferencia"]).optional(),
  observacoesCusto: z.string().optional(),
});

export default function OrcamentoTab({ ordem, onOrdemUpdate }: OrcamentoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicosEditando, setServicosEditando] = useState<Record<string, boolean>>({});
  const { canEditOrder } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      custoTotal: ordem.custoTotal || calcularCustoTotal(),
      precoTotal: ordem.precoTotal || calcularPrecoTotal(),
      formaPagamento: ordem.formaPagamento || "dinheiro",
      observacoesCusto: ordem.observacoesCusto || "",
    },
  });

  // Formatação de valores monetários
  const formatarValor = (valor?: number) => {
    if (valor === undefined) return "-";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Calcula o custo total com base nos serviços
  function calcularCustoTotal(): number {
    return ordem.servicos.reduce((total, servico) => {
      const custoServico = (servico.custoMaterial || 0) + (servico.custoMaoDeObra || 0);
      return total + custoServico;
    }, 0);
  }

  // Calcula o preço total com base nos serviços
  function calcularPrecoTotal(): number {
    return ordem.servicos.reduce((total, servico) => {
      return total + (servico.precoVenda || 0);
    }, 0);
  }

  // Calcula o preço da tabela com base nos serviços e subatividades selecionadas
  function calcularPrecoTabela(): number {
    return ordem.servicos.reduce((total, servico) => {
      const tabelaServico = TABELA_PRECOS_PADRAO[servico.tipo];
      
      if (!tabelaServico) return total;
      
      let precoServico = tabelaServico.precoBase;
      
      // Adiciona preços de subatividades selecionadas
      if (servico.subatividades && tabelaServico.subatividades) {
        servico.subatividades.forEach(sub => {
          if (sub.selecionada && tabelaServico.subatividades?.[sub.nome]) {
            precoServico += tabelaServico.subatividades[sub.nome];
          }
        });
      }
      
      return total + precoServico;
    }, 0);
  }

  // Calcula o preço da tabela para um serviço específico
  function calcularPrecoTabelaServico(servico: Servico): number {
    const tabelaServico = TABELA_PRECOS_PADRAO[servico.tipo];
    
    if (!tabelaServico) return 0;
    
    let precoServico = tabelaServico.precoBase;
    
    // Adiciona preços de subatividades selecionadas
    if (servico.subatividades && tabelaServico.subatividades) {
      servico.subatividades.forEach(sub => {
        if (sub.selecionada && tabelaServico.subatividades?.[sub.nome]) {
          precoServico += tabelaServico.subatividades[sub.nome];
        }
      });
    }
    
    return precoServico;
  }
  
  // Processa o envio do formulário geral de orçamento
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, {
        custoTotal: data.custoTotal,
        precoTotal: data.precoTotal,
        formaPagamento: data.formaPagamento,
        observacoesCusto: data.observacoesCusto,
      });
      
      const novaOrdem = {
        ...ordem,
        custoTotal: data.custoTotal,
        precoTotal: data.precoTotal,
        formaPagamento: data.formaPagamento,
        observacoesCusto: data.observacoesCusto,
      };
      
      onOrdemUpdate(novaOrdem);
      setIsEditing(false);
      toast.success("Orçamento atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      toast.error("Erro ao atualizar orçamento");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Atualiza os custos de um serviço específico
  const atualizarCustoServico = async (servicoIndex: number, custoMaterial: number, custoMaoDeObra: number, precoVenda: number) => {
    try {
      const servicosAtualizados = [...ordem.servicos];
      servicosAtualizados[servicoIndex] = {
        ...servicosAtualizados[servicoIndex],
        custoMaterial,
        custoMaoDeObra,
        precoVenda,
        precoTabela: calcularPrecoTabelaServico(servicosAtualizados[servicoIndex])
      };
      
      // Atualiza no Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, {
        servicos: servicosAtualizados,
      });
      
      // Atualiza o estado local
      const novaOrdem = {
        ...ordem,
        servicos: servicosAtualizados,
      };
      
      onOrdemUpdate(novaOrdem);
      
      // Remove do estado de edição
      const novosServicosEditando = { ...servicosEditando };
      delete novosServicosEditando[servicoIndex.toString()];
      setServicosEditando(novosServicosEditando);
      
      toast.success("Serviço atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar custos do serviço:", error);
      toast.error("Erro ao atualizar serviço");
    }
  };
  
  // Aplica os preços da tabela a todos os serviços
  const aplicarPrecosTabelaATodos = async () => {
    try {
      const servicosAtualizados = ordem.servicos.map(servico => {
        const precoTabela = calcularPrecoTabelaServico(servico);
        return {
          ...servico,
          precoVenda: precoTabela,
          precoTabela
        };
      });
      
      const precoTabelaTotal = servicosAtualizados.reduce((total, servico) => {
        return total + (servico.precoVenda || 0);
      }, 0);
      
      // Atualiza no Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, {
        servicos: servicosAtualizados,
        precoTotal: precoTabelaTotal,
        precoTabelaTotal
      });
      
      // Atualiza o estado local
      const novaOrdem = {
        ...ordem,
        servicos: servicosAtualizados,
        precoTotal: precoTabelaTotal,
        precoTabelaTotal
      };
      
      onOrdemUpdate(novaOrdem);
      form.setValue("precoTotal", precoTabelaTotal);
      
      toast.success("Preços da tabela aplicados com sucesso");
    } catch (error) {
      console.error("Erro ao aplicar preços da tabela:", error);
      toast.error("Erro ao aplicar preços da tabela");
    }
  };
  
  // Calcula o lucro e a margem
  const precoTotal = form.watch("precoTotal") || 0;
  const custoTotal = form.watch("custoTotal") || 0;
  const lucro = precoTotal - custoTotal;
  const margem = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;
  
  // Calcula o preço da tabela total
  const precoTabelaTotal = calcularPrecoTabela();
  const diferencaTabela = precoTotal - precoTabelaTotal;
  const percentualDiferenca = precoTabelaTotal > 0 
    ? ((precoTotal - precoTabelaTotal) / precoTabelaTotal) * 100 
    : 0;
  
  // Verifica se o usuário tem permissão para editar
  const canEdit = canEditOrder(ordem.id);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Orçamento</CardTitle>
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="custoTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Total</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="0,00" 
                            className="pl-8" 
                            {...field} 
                            disabled={!isEditing} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="precoTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="0,00" 
                            className="pl-8" 
                            {...field} 
                            disabled={!isEditing} 
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary/10 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Lucro</p>
                  <p className="text-xl font-bold">{formatarValor(lucro)}</p>
                </div>
                
                <div className="bg-primary/10 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Margem</p>
                  <p className="text-xl font-bold flex items-center">
                    <PercentIcon className="h-4 w-4 mr-1" />
                    {margem.toFixed(2)}%
                  </p>
                </div>
                
                <div className={`p-4 rounded-md ${
                  diferencaTabela < 0 ? 'bg-red-100' : diferencaTabela > 0 ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">Comparado à Tabela</p>
                  <p className="text-xl font-bold flex items-center">
                    {diferencaTabela < 0 ? '↓' : diferencaTabela > 0 ? '↑' : '='}
                    {formatarValor(Math.abs(diferencaTabela))} ({percentualDiferenca.toFixed(1)}%)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        disabled={!isEditing}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="observacoesCusto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre o orçamento..." 
                          className="resize-none" 
                          {...field} 
                          disabled={!isEditing} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {canEdit && isEditing && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Serviços e Preços</CardTitle>
          {canEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={aplicarPrecosTabelaATodos}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Aplicar Preços da Tabela
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Serviço</TableHead>
                  <TableHead>Custo Material</TableHead>
                  <TableHead>Custo Mão de Obra</TableHead>
                  <TableHead>Preço de Venda</TableHead>
                  <TableHead>Preço Tabela</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordem.servicos.map((servico, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell className="font-medium">
                        {servico.tipo === 'bloco' && 'Bloco'}
                        {servico.tipo === 'biela' && 'Biela'}
                        {servico.tipo === 'cabecote' && 'Cabeçote'}
                        {servico.tipo === 'virabrequim' && 'Virabrequim'}
                        {servico.tipo === 'eixo_comando' && 'Eixo de Comando'}
                        {servico.tipo === 'montagem' && 'Montagem'}
                        {servico.tipo === 'dinamometro' && 'Dinamômetro'}
                        {servico.tipo === 'lavagem' && 'Lavagem'}
                      </TableCell>
                      {servicosEditando[index] ? (
                        <>
                          <TableCell>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="0,00" 
                                className="pl-8 w-24" 
                                defaultValue={servico.custoMaterial || 0}
                                id={`custoMaterial-${index}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="0,00" 
                                className="pl-8 w-24" 
                                defaultValue={servico.custoMaoDeObra || 0}
                                id={`custoMaoDeObra-${index}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="0,00" 
                                className="pl-8 w-24" 
                                defaultValue={servico.precoVenda || 0}
                                id={`precoVenda-${index}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatarValor(calcularPrecoTabelaServico(servico))}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  const custoMaterial = parseFloat((document.getElementById(`custoMaterial-${index}`) as HTMLInputElement).value);
                                  const custoMaoDeObra = parseFloat((document.getElementById(`custoMaoDeObra-${index}`) as HTMLInputElement).value);
                                  const precoVenda = parseFloat((document.getElementById(`precoVenda-${index}`) as HTMLInputElement).value);
                                  
                                  atualizarCustoServico(
                                    index, 
                                    isNaN(custoMaterial) ? 0 : custoMaterial, 
                                    isNaN(custoMaoDeObra) ? 0 : custoMaoDeObra, 
                                    isNaN(precoVenda) ? 0 : precoVenda
                                  );
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const novosServicosEditando = { ...servicosEditando };
                                  delete novosServicosEditando[index.toString()];
                                  setServicosEditando(novosServicosEditando);
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{formatarValor(servico.custoMaterial)}</TableCell>
                          <TableCell>{formatarValor(servico.custoMaoDeObra)}</TableCell>
                          <TableCell>{formatarValor(servico.precoVenda)}</TableCell>
                          <TableCell>{formatarValor(calcularPrecoTabelaServico(servico))}</TableCell>
                          <TableCell>
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setServicosEditando({
                                    ...servicosEditando,
                                    [index]: true
                                  });
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                    {servico.descricao && (
                      <TableRow className="border-0">
                        <TableCell colSpan={6} className="text-sm text-muted-foreground py-1">
                          <div className="pl-4 border-l-2 border-muted">
                            {servico.descricao}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {servico.subatividades && servico.subatividades.some(sub => sub.selecionada) && (
                      <TableRow className="border-0">
                        <TableCell colSpan={6} className="py-1">
                          <div className="pl-4 border-l-2 border-muted">
                            <p className="text-xs text-muted-foreground mb-1">Subatividades:</p>
                            <div className="flex flex-wrap gap-1">
                              {servico.subatividades.filter(sub => sub.selecionada).map((sub, subIdx) => (
                                <span 
                                  key={subIdx}
                                  className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                                >
                                  {sub.nome}
                                </span>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="h-1">
                      <TableCell colSpan={6} className="p-0">
                        <Separator className="my-1" />
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 justify-between">
          <div>
            <p className="text-sm font-medium">Preço da Tabela</p>
            <p className="text-lg font-bold">{formatarValor(precoTabelaTotal)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Preço Final</p>
            <p className="text-lg font-bold">{formatarValor(precoTotal)}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
