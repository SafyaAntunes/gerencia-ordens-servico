
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico } from "@/types/ordens";
import DownloadImagesButton from "@/components/common/DownloadImagesButton";
import { useEffect, useState } from "react";

interface FotosTabProps {
  ordem: OrdemServico;
}

export function FotosTab({ ordem }: FotosTabProps) {
  // Estado para armazenar URLs únicas de fotos
  const [fotosEntradaUrls, setFotosEntradaUrls] = useState<string[]>([]);
  const [fotosSaidaUrls, setFotosSaidaUrls] = useState<string[]>([]);
  
  // Função para garantir que as URLs são únicas
  const getUniqueUrls = (fotos: any[] | undefined) => {
    if (!fotos || !Array.isArray(fotos)) return [];
    
    const urlMap = new Map();
    
    fotos.forEach(foto => {
      if (typeof foto === 'string') {
        // Se for uma URL, adicionar ao mapa com a URL como chave
        urlMap.set(foto, foto);
      } else if (foto && typeof foto === 'object' && foto.data) {
        // Se for um objeto com data, adicionar ao mapa com data como chave
        urlMap.set(foto.data, foto.data);
      }
    });
    
    // Converter o mapa de volta para um array
    return Array.from(urlMap.values());
  };
  
  // Processar as fotos quando a ordem for carregada ou mudar
  useEffect(() => {
    console.log("Processando fotos da ordem:", ordem.id);
    setFotosEntradaUrls(getUniqueUrls(ordem.fotosEntrada));
    setFotosSaidaUrls(getUniqueUrls(ordem.fotosSaida));
  }, [ordem.id, ordem.fotosEntrada, ordem.fotosSaida]);
  
  console.log("Fotos de entrada únicas:", fotosEntradaUrls.length);
  console.log("Fotos de saída únicas:", fotosSaidaUrls.length);
  
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
            {fotosEntradaUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotosEntradaUrls.map((foto, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <img 
                      src={foto} 
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
            {fotosSaidaUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotosSaidaUrls.map((foto, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                    <img 
                      src={foto} 
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
