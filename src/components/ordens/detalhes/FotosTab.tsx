
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico } from "@/types/ordens";
import DownloadImagesButton from "@/components/common/DownloadImagesButton";

interface FotosTabProps {
  ordem: OrdemServico;
}

export function FotosTab({ ordem }: FotosTabProps) {
  // Filtrar apenas URLs de string (remover arquivos locais se houver)
  const fotosEntradaUrls = ordem.fotosEntrada 
    ? ordem.fotosEntrada
        .filter(foto => typeof foto === 'string')
        .map(foto => foto.toString())
    : [];

  const fotosSaidaUrls = ordem.fotosSaida 
    ? ordem.fotosSaida
        .filter(foto => typeof foto === 'string')
        .map(foto => foto.toString())
    : [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Arquivos da Ordem</h3>
        <div className="flex gap-2">
          {fotosEntradaUrls.length > 0 && (
            <DownloadImagesButton 
              imageUrls={fotosEntradaUrls} 
              zipName={`fotos-entrada-ordem-${ordem.id}`} 
              buttonText="Baixar Fotos de Entrada" 
            />
          )}
          {fotosSaidaUrls.length > 0 && (
            <DownloadImagesButton 
              imageUrls={fotosSaidaUrls} 
              zipName={`fotos-saida-ordem-${ordem.id}`}
              buttonText="Baixar Fotos de Saída"
              variant="secondary" 
            />
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fotos de Entrada</CardTitle>
          </CardHeader>
          <CardContent>
            {ordem.fotosEntrada && ordem.fotosEntrada.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
    </div>
  );
}
