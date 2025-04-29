
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SubAtividade, TipoServico, TipoAtividade } from '@/types/ordens';
import { CurrencyInput } from '@/components/ui/currency-input';

// Esquema de validação
const formSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3, { message: 'O nome precisa ter pelo menos 3 caracteres' }),
  precoHora: z.number().min(0, { message: 'O preço não pode ser negativo' }).optional(),
  tempoEstimado: z.number().min(0, { message: 'O tempo não pode ser negativo' }).optional(),
  descricao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubatividadeFormProps {
  onSave: (data: SubAtividade) => void;
  tipoServico: TipoServico | TipoAtividade;
  initialData: SubAtividade | null;
  onCancel: () => void;
}

export function SubatividadeForm({ onSave, tipoServico, initialData, onCancel }: SubatividadeFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      nome: '',
      precoHora: 0,
      tempoEstimado: 0,
      descricao: '',
    },
  });

  // Atualiza o form quando o initialData muda
  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        nome: initialData.nome,
        precoHora: initialData.precoHora || 0,
        tempoEstimado: initialData.tempoEstimado || 0,
        descricao: initialData.descricao || '',
      });
    } else {
      form.reset({
        id: '',
        nome: '',
        precoHora: 0,
        tempoEstimado: 0,
        descricao: '',
      });
    }
  }, [initialData, form]);

  const onSubmit = (data: FormValues) => {
    const subatividade: SubAtividade = {
      id: data.id || uuidv4(),
      nome: data.nome,
      precoHora: data.precoHora || 0,
      tempoEstimado: data.tempoEstimado || 0,
      selecionada: initialData?.selecionada || false,
      servicoTipo: initialData?.servicoTipo,
      descricao: data.descricao,
    };
    
    onSave(subatividade);
    
    if (!initialData) {
      form.reset({
        id: '',
        nome: '',
        precoHora: 0,
        tempoEstimado: 0,
        descricao: '',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Subatividade</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome da subatividade" {...field} />
              </FormControl>
              <FormDescription>
                Nome que aparecerá na lista de subatividades da OS
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="precoHora"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço por Hora (R$)</FormLabel>
              <FormControl>
                <CurrencyInput
                  placeholder="0,00"
                  value={field.value || 0}
                  onValueChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormDescription>
                Valor cobrado por hora para esta subatividade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tempoEstimado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo Padrão (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Tempo padrão estimado para esta subatividade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição opcional da subatividade"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Adicione uma descrição para explicar melhor esta subatividade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {initialData && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit">
            {initialData ? 'Atualizar' : 'Adicionar'} Subatividade
          </Button>
        </div>
      </form>
    </Form>
  );
}
