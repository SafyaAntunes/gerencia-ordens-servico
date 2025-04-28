
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico } from "@/types/ordens";

interface FotosTabProps {
  ordem: OrdemServico;
}

export function FotosTab({ ordem }: FotosTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Fotos de Entrada</CardTitle>
        </CardHeader>
        <CardContent>
          {ordem.fotosEntrada && ordem.fotosEntrada.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {ordem.fotosEntrada.map((foto, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                  <img 
                    src={typeof foto === 'string' ? foto : foto.data} 
                    alt={`Foto de entrada ${index + 1}`} 
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma foto de entrada.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Fotos de Saída</CardTitle>
        </CardHeader>
        <CardContent>
          {ordem.fotosSaida && ordem.fotosSaida.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {ordem.fotosSaida.map((foto, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                  <img 
                    src={typeof foto === 'string' ? foto : foto.data} 
                    alt={`Foto de saída ${index + 1}`} 
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma foto de saída.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

