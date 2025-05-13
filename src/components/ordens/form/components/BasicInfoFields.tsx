
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

interface BasicInfoFieldsProps {
  form: UseFormReturn<FormValues>;
}

export const BasicInfoFields = ({ form }: BasicInfoFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número da OS</FormLabel>
            <FormControl>
              <Input placeholder="001/2023" {...field} />
            </FormControl>
            <FormDescription>
              Número ou identificador único da OS
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Ordem de Serviço</FormLabel>
            <FormControl>
              <Input placeholder="Motor Ford Ka 2019" {...field} />
            </FormControl>
            <FormDescription>
              Nome ou identificação da OS
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
