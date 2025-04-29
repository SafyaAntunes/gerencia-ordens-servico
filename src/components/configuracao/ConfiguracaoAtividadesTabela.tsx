
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { TipoServico, TipoAtividade } from "@/types/ordens";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ConfiguracaoItem {
  tipo: TipoServico;
  nome: string;
  horaPadrao: string;
  valorHora: number;
}

interface ConfiguracaoAtividadesTabelaProps {
  tipoAtividade: TipoAtividade;
  titulo: string;
  descricao: string;
  itens: ConfiguracaoItem[];
  onItemChange: (tipo: TipoServico, campo: 'horaPadrao' | 'valorHora', valor: string | number) => void;
}

export default function ConfiguracaoAtividadesTabela({
  tipoAtividade,
  titulo,
  descricao,
  itens,
  onItemChange
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
              <TableHead className="w-[40%]">GRUPO</TableHead>
              <TableHead className="w-[30%]">HORA PADRÃO</TableHead>
              <TableHead className="w-[30%]">VALOR (R$)</TableHead>
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
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valorHora}
                    onChange={(e) => onItemChange(item.tipo, 'valorHora', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
