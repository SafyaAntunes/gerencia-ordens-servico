
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico } from "@/types/ordens";
import DownloadImagesButton from "@/components/common/DownloadImagesButton";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash, Maximize, Play, X, Image, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";

interface FotosTabProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
}

interface MidiaItem {
  url: string;
  tipo: 'imagem' | 'video';
}

export function FotosTab({ ordem, onOrdemUpdate }: FotosTabProps) {
  // Estados para seleção e gerenciamento de mídia
  const [fotosEntradaUrls, setFotosEntradaUrls] = useState<MidiaItem[]>([]);
  const [fotosSaidaUrls, setFotosSaidaUrls] = useState<MidiaItem[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [midiaAtual, setMidiaAtual] = useState<MidiaItem | null>(null);
  const [selecionados, setSelecionados] = useState<{[key: string]: boolean}>({});
  const [tipoSelecionado, setTipoSelecionado] = useState<'entrada' | 'saida' | null>(null);
  const { deleteFile } = useStorage();
  
  // Função para detectar o tipo de arquivo baseado na URL ou extensão
  const detectarTipoArquivo = (url: string): 'imagem' | 'video' => {
    if (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video')) {
      return 'video';
    }
    return 'imagem';
  };
  
  // Função para extrair URLs únicas e detectar tipo
  const getUniqueUrls = (fotos: any[] | undefined) => {
    if (!fotos || !Array.isArray(fotos)) return [];
    
    const urlMap = new Map<string, MidiaItem>();
    
    fotos.forEach(foto => {
      if (typeof foto === 'string') {
        const tipo = detectarTipoArquivo(foto);
        urlMap.set(foto, { url: foto, tipo });
      } else if (foto && typeof foto === 'object' && foto.data) {
        const tipo = detectarTipoArquivo(foto.data);
        urlMap.set(foto.data, { url: foto.data, tipo });
      }
    });
    
    return Array.from(urlMap.values());
  };
  
  // Processar os arquivos quando a ordem mudar
  useEffect(() => {
    console.log("Processando arquivos da ordem:", ordem.id);
    setFotosEntradaUrls(getUniqueUrls(ordem.fotosEntrada));
    setFotosSaidaUrls(getUniqueUrls(ordem.fotosSaida));
    // Limpar seleções quando a ordem mudar
    setSelecionados({});
    setTipoSelecionado(null);
  }, [ordem.id, ordem.fotosEntrada, ordem.fotosSaida]);
  
  // Abrir o modal de visualização
  const abrirModal = (midia: MidiaItem) => {
    setMidiaAtual(midia);
    setModalAberto(true);
  };
  
  // Alternar seleção de um item
  const toggleSelecao = (url: string, tipo: 'entrada' | 'saida') => {
    // Se estamos selecionando um tipo diferente do atual, limpar seleções anteriores
    if (tipoSelecionado !== null && tipoSelecionado !== tipo) {
      setSelecionados({});
    }
    
    setTipoSelecionado(tipo);
    setSelecionados(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };
  
  // Contar itens selecionados
  const contarSelecionados = () => {
    return Object.values(selecionados).filter(Boolean).length;
  };
  
  // Excluir itens selecionados
  const excluirSelecionados = async () => {
    if (!onOrdemUpdate || contarSelecionados() === 0) return;
    
    // URLs selecionadas para exclusão
    const urlsParaExcluir = Object.keys(selecionados).filter(url => selecionados[url]);
    
    // Clonar arrays de fotos
    const novasFotosEntrada = [...ordem.fotosEntrada || []];
    const novasFotosSaida = [...ordem.fotosSaida || []];
    
    let contadorExcluidos = 0;
    
    // Excluir do Firebase Storage e dos arrays
    for (const url of urlsParaExcluir) {
      try {
        if (tipoSelecionado === 'entrada') {
          const index = novasFotosEntrada.indexOf(url);
          if (index !== -1) {
            novasFotosEntrada.splice(index, 1);
          }
        } else if (tipoSelecionado === 'saida') {
          const index = novasFotosSaida.indexOf(url);
          if (index !== -1) {
            novasFotosSaida.splice(index, 1);
          }
        }
        
        // Excluir do Firebase Storage
        await deleteFile(url);
        contadorExcluidos++;
      } catch (error) {
        console.error("Erro ao excluir arquivo:", url, error);
      }
    }
    
    // Atualizar ordem com novos arrays de fotos
    const ordemAtualizada = {
      ...ordem,
      fotosEntrada: novasFotosEntrada,
      fotosSaida: novasFotosSaida
    };
    
    onOrdemUpdate(ordemAtualizada);
    toast.success(`${contadorExcluidos} arquivo(s) excluído(s) com sucesso!`);
    
    // Limpar seleções
    setSelecionados({});
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Arquivos da Ordem</h3>
        <div className="flex gap-2">
          {fotosEntradaUrls.length > 0 && (
            <DownloadImagesButton 
              imageUrls={fotosEntradaUrls.map(item => item.url)} 
              zipName={`fotos-entrada-ordem-${ordem.id}`} 
              buttonText="Baixar Fotos de Entrada" 
            />
          )}
          {fotosSaidaUrls.length > 0 && (
            <DownloadImagesButton 
              imageUrls={fotosSaidaUrls.map(item => item.url)} 
              zipName={`fotos-saida-ordem-${ordem.id}`}
              buttonText="Baixar Fotos de Saída"
              variant="secondary" 
            />
          )}
        </div>
      </div>
      
      {contarSelecionados() > 0 && onOrdemUpdate && (
        <div className="flex justify-between items-center bg-muted p-3 rounded-md">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{contarSelecionados()} selecionado(s)</Badge>
            <span className="text-sm">
              {tipoSelecionado === 'entrada' ? 'Arquivos de entrada' : 'Arquivos de saída'}
            </span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={excluirSelecionados} 
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            Excluir selecionados
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Fotos de Entrada</CardTitle>
            <Badge variant="outline">{fotosEntradaUrls.length}</Badge>
          </CardHeader>
          <CardContent>
            {fotosEntradaUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotosEntradaUrls.map((item, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-md overflow-hidden group border border-border hover:border-primary transition-colors"
                  >
                    {onOrdemUpdate && (
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox 
                          checked={!!selecionados[item.url]}
                          onCheckedChange={() => toggleSelecao(item.url, 'entrada')}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white bg-black/30"
                        />
                      </div>
                    )}

                    {item.tipo === 'imagem' ? (
                      <>
                        <img 
                          src={item.url} 
                          alt={`Arquivo ${index + 1}`} 
                          className="object-cover w-full h-full cursor-pointer"
                          onClick={() => abrirModal(item)}
                          onError={(e) => {
                            console.error("Erro ao carregar imagem:", item.url);
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => abrirModal(item)}
                          >
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">
                            <Image className="h-3 w-3 mr-1" />
                            Imagem
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        <video 
                          src={item.url} 
                          className="object-cover w-full h-full cursor-pointer"
                          onClick={() => abrirModal(item)}
                          onError={(e) => {
                            console.error("Erro ao carregar vídeo:", item.url);
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => abrirModal(item)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">
                            <Video className="h-3 w-3 mr-1" />
                            Vídeo
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum arquivo de entrada.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Fotos de Saída</CardTitle>
            <Badge variant="outline">{fotosSaidaUrls.length}</Badge>
          </CardHeader>
          <CardContent>
            {fotosSaidaUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotosSaidaUrls.map((item, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-md overflow-hidden group border border-border hover:border-primary transition-colors"
                  >
                    {onOrdemUpdate && (
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox 
                          checked={!!selecionados[item.url]}
                          onCheckedChange={() => toggleSelecao(item.url, 'saida')}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white bg-black/30"
                        />
                      </div>
                    )}
                    
                    {item.tipo === 'imagem' ? (
                      <>
                        <img 
                          src={item.url} 
                          alt={`Arquivo ${index + 1}`} 
                          className="object-cover w-full h-full cursor-pointer"
                          onClick={() => abrirModal(item)}
                          onError={(e) => {
                            console.error("Erro ao carregar imagem:", item.url);
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => abrirModal(item)}
                          >
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">
                            <Image className="h-3 w-3 mr-1" />
                            Imagem
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        <video 
                          src={item.url} 
                          className="object-cover w-full h-full cursor-pointer"
                          onClick={() => abrirModal(item)}
                          onError={(e) => {
                            console.error("Erro ao carregar vídeo:", item.url);
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => abrirModal(item)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary">
                            <Video className="h-3 w-3 mr-1" />
                            Vídeo
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum arquivo de saída.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modal para visualização ampliada */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-1 overflow-hidden bg-background/95 backdrop-blur">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 z-10" 
            onClick={() => setModalAberto(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="w-full h-full flex items-center justify-center p-6">
            {midiaAtual && midiaAtual.tipo === 'imagem' ? (
              <img 
                src={midiaAtual.url} 
                alt="Visualização ampliada" 
                className="max-w-full max-h-[80vh] object-contain" 
              />
            ) : midiaAtual && (
              <video 
                src={midiaAtual.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
