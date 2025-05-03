
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TipoServico, TipoAtividade } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

interface ConfiguracaoItem {
  tipo: TipoServico;
  nome: string;
  horaPadrao: string;
  tempoPadrao: number;
}

interface ConfiguracaoAtividadesTabelaProps {
  tipoAtividade: TipoAtividade;
  titulo: string;
  descricao: string;
  itens: ConfiguracaoItem[];
  onItemChange: (tipo: TipoServico, campo: 'horaPadrao' | 'tempoPadrao', valor: string | number) => void;
  onItemEdit?: (item: ConfiguracaoItem) => void;
  onItemDelete?: (tipo: TipoServico) => void;
}

export default function ConfiguracaoAtividadesTabela({
  tipoAtividade,
  titulo,
  descricao,
  itens,
  onItemChange,
  onItemEdit,
  onItemDelete
}: ConfiguracaoAtividadesTabelaProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">GRUPO</TableHead>
              <TableHead className="w-[30%]">TEMPO PADRÃO (HH:MM)</TableHead>
              <TableHead className="w-[10%] text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => (
              <TableRow key={item.tipo}>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={item.horaPadrao}
                    onChange={(e) => onItemChange(item.tipo, 'horaPadrao', e.target.value)}
                    className="w-full"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {onItemEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onItemEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onItemDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onItemDelete(item.tipo)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
