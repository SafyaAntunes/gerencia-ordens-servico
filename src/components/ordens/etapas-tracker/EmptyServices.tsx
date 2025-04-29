
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyServices() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tracker de Serviços</CardTitle>
        <CardDescription>
          Não há serviços com subatividades selecionadas para esta ordem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-6">
          Edite a ordem para selecionar serviços e subatividades.
        </p>
      </CardContent>
    </Card>
  );
}
