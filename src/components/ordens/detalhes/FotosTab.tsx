
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
  valida: boolean;
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
  
  // Função para validar URL
  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    // Verificação básica se a URL é válida
    return url.startsWith('http') || url.startsWith('data:');
  };
  
  // Função para extrair URLs únicas e detectar tipo
  const getUniqueUrls = (fotos: any[] | undefined) => {
    if (!fotos || !Array.isArray(fotos)) return [];
    
    const urlMap = new Map<string, MidiaItem>();
    
    fotos.forEach(foto => {
      if (typeof foto === 'string' && isValidUrl(foto)) {
        const tipo = detectarTipoArquivo(foto);
        urlMap.set(foto, { url: foto, tipo, valida: true });
      } else if (foto && typeof foto === 'object' && foto.data && isValidUrl(foto.data)) {
        const tipo = detectarTipoArquivo(foto.data);
        urlMap.set(foto.data, { url: foto.data, tipo, valida: true });
      }
    });
    
    return Array.from(urlMap.values());
  };
  
  // Processar os arquivos quando a ordem mudar
  useEffect(() => {
    console.log("Processando arquivos da ordem:", ordem.id);
    // Garantir que os arrays existam, mesmo que vazios
    const fotosEntrada = ordem.fotosEntrada || [];
    const fotosSaida = ordem.fotosSaida || [];
    
    setFotosEntradaUrls(getUniqueUrls(fotosEntrada));
    setFotosSaidaUrls(getUniqueUrls(fotosSaida));
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
  
  // Verificar se uma URL de imagem é válida
  const handleImageError = (url: string, tipo: 'entrada' | 'saida') => {
    console.error("Erro ao carregar imagem:", url);
    
    // Marcar a imagem como inválida em seu respectivo array
    if (tipo === 'entrada') {
      setFotosEntradaUrls(prev => 
        prev.map(item => item.url === url ? { ...item, valida: false } : item)
      );
    } else {
      setFotosSaidaUrls(prev => 
        prev.map(item => item.url === url ? { ...item, valida: false } : item)
      );
    }
  };
  
  // Excluir itens selecionados
  const excluirSelecionados = async () => {
    if (!onOrdemUpdate || contarSelecionados() === 0) return;
    
    // URLs selecionadas para exclusão
    const urlsParaExcluir = Object.keys(selecionados).filter(url => selecionados[url]);
    
    // Clonar arrays de fotos, garantindo que existam
    let novasFotosEntrada = [...(ordem.fotosEntrada || [])];
    let novasFotosSaida = [...(ordem.fotosSaida || [])];
    
    let contadorExcluidos = 0;
    
    // Excluir do Firebase Storage e dos arrays
    for (const url of urlsParaExcluir) {
      try {
        if (tipoSelecionado === 'entrada') {
          // Filtrar URLs diretamente (string) ou objetos com a URL em data
          novasFotosEntrada = novasFotosEntrada.filter(foto => {
            if (typeof foto === 'string') {
              return foto !== url;
            } else if (foto && typeof foto === 'object' && foto.data) {
              return foto.data !== url;
            }
            return true;
          });
        } else if (tipoSelecionado === 'saida') {
          // Filtrar URLs diretamente (string) ou objetos com a URL em data
          novasFotosSaida = novasFotosSaida.filter(foto => {
            if (typeof foto === 'string') {
              return foto !== url;
            } else if (foto && typeof foto === 'object' && foto.data) {
              return foto.data !== url;
            }
            return true;
          });
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
  
  // Limpar URLs inválidas da ordem
  const limparUrlsInvalidas = () => {
    if (!onOrdemUpdate) return;
    
    // Filtrar apenas fotos válidas
    const fotosEntradaValidas = fotosEntradaUrls
      .filter(item => item.valida)
      .map(item => item.url);
      
    const fotosSaidaValidas = fotosSaidaUrls
      .filter(item => item.valida)
      .map(item => item.url);
    
    // Filtrar os arrays originais mantendo apenas URLs válidas
    const entradaFiltrada = ordem.fotosEntrada?.filter(foto => {
      const url = typeof foto === 'string' ? foto : (foto as any)?.data;
      return url && fotosEntradaValidas.includes(url);
    });
    
    const saidaFiltrada = ordem.fotosSaida?.filter(foto => {
      const url = typeof foto === 'string' ? foto : (foto as any)?.data;
      return url && fotosSaidaValidas.includes(url);
    });
    
    // Atualizar ordem com arrays filtrados
    const ordemAtualizada = {
      ...ordem,
      fotosEntrada: entradaFiltrada || [],
      fotosSaida: saidaFiltrada || []
    };
    
    onOrdemUpdate(ordemAtualizada);
    toast.success("Arquivos inválidos removidos com sucesso!");
  };
  
  // Verificar se há fotos inválidas
  const temFotosInvalidas = 
    fotosEntradaUrls.some(item => !item.valida) || 
    fotosSaidaUrls.some(item => !item.valida);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Arquivos da Ordem</h3>
        <div className="flex gap-2">
          {fotosEntradaUrls.length > 0 && (
            <DownloadImagesButton 
              imageUrls={fotosEntradaUrls.filter(item => item.valida).map(item => item.url)} 
              zipName={`fotos-entrada-ordem-${ordem.id}`} 
              buttonText="Baixar Fotos de Entrada" 
            />
          )}
          {fotosSaidaUrls.length > 0 && (
            <DownloadImagesButton 
              imageUrls={fotosSaidaUrls.filter(item => item.valida).map(item => item.url)} 
              zipName={`fotos-saida-ordem-${ordem.id}`}
              buttonText="Baixar Fotos de Saída"
              variant="secondary" 
            />
          )}
          
          {temFotosInvalidas && onOrdemUpdate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={limparUrlsInvalidas}
            >
              <Trash className="h-4 w-4 mr-2" />
              Limpar inválidas
            </Button>
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
            <Badge variant="outline">{fotosEntradaUrls.filter(item => item.valida).length}</Badge>
          </CardHeader>
          <CardContent>
            {fotosEntradaUrls.filter(item => item.valida).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotosEntradaUrls.filter(item => item.valida).map((item, index) => (
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
                          onError={() => handleImageError(item.url, 'entrada')}
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
                          onError={() => handleImageError(item.url, 'entrada')}
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
              <p className="text-muted-foreground">Nenhum arquivo de entrada válido.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Fotos de Saída</CardTitle>
            <Badge variant="outline">{fotosSaidaUrls.filter(item => item.valida).length}</Badge>
          </CardHeader>
          <CardContent>
            {fotosSaidaUrls.filter(item => item.valida).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotosSaidaUrls.filter(item => item.valida).map((item, index) => (
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
                          onError={() => handleImageError(item.url, 'saida')}
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
                          onError={() => handleImageError(item.url, 'saida')}
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
              <p className="text-muted-foreground">Nenhum arquivo de saída válido.</p>
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
