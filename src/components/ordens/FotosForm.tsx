
import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Camera, Upload, AlertTriangle, Trash, Gallery } from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FotosFormProps {
  fotosEntrada: any[]; // Pode ser File ou string URL
  fotosSaida: any[]; // Pode ser File ou string URL
  onChangeFotosEntrada: (fotos: any[]) => void;
  onChangeFotosSaida: (fotos: any[]) => void;
  ordemId?: string; // ID da ordem para organizar os uploads
}

export default function FotosForm({
  fotosEntrada = [],
  fotosSaida = [],
  onChangeFotosEntrada,
  onChangeFotosSaida,
  ordemId = "temp",
}: FotosFormProps) {
  const [activeTab, setActiveTab] = useState("entrada");
  const { uploadFile, deleteFile, isUploading, storageStats, formatStorageSize } = useStorage();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  
  // Refs para os inputs de arquivo
  const entradaInputRef = useRef<HTMLInputElement>(null);
  const saidaInputRef = useRef<HTMLInputElement>(null);
  
  // Helper para verificar se um arquivo é imagem
  const isImage = (file: File | string): boolean => {
    if (typeof file === 'string') {
      return file.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) !== null || file.includes('image');
    }
    return file.type.startsWith('image/');
  };
  
  // Helper para verificar se um arquivo é vídeo
  const isVideo = (file: File | string): boolean => {
    if (typeof file === 'string') {
      return file.match(/\.(mp4|webm|ogg|mov|avi)$/i) !== null || file.includes('video');
    }
    return file.type.startsWith('video/');
  };

  // Função para lidar com upload múltiplo de arquivos de entrada
  const handleAddMultipleFotosEntrada = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploadError(null);
      const newFiles = Array.from(files);
      
      if (ordemId !== "temp") {
        toast.loading(`Enviando ${newFiles.length} arquivo(s)...`);
        const uploadPromises = newFiles.map(file => 
          uploadFile(file, `ordens/${ordemId}/entrada`)
        );
        
        const results = await Promise.all(uploadPromises);
        const validResults = results.filter(url => url !== null) as string[];
        
        if (validResults.length > 0) {
          onChangeFotosEntrada([...fotosEntrada, ...validResults]);
          toast.success(`${validResults.length} arquivo(s) carregado(s) com sucesso!`);
        } 
        
        if (validResults.length < newFiles.length) {
          setUploadError(`Falha ao fazer upload de ${newFiles.length - validResults.length} arquivo(s). Verifique as permissões de acesso ao Storage.`);
        }
      } else {
        onChangeFotosEntrada([...fotosEntrada, ...newFiles]);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      setUploadError("Erro ao processar arquivos. Verifique as permissões de acesso ao Storage.");
      toast.error("Erro ao processar arquivos");
    }
  };

  // Função para lidar com upload múltiplo de arquivos de saída
  const handleAddMultipleFotosSaida = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploadError(null);
      const newFiles = Array.from(files);
      
      if (ordemId !== "temp") {
        toast.loading(`Enviando ${newFiles.length} arquivo(s)...`);
        const uploadPromises = newFiles.map(file => 
          uploadFile(file, `ordens/${ordemId}/saida`)
        );
        
        const results = await Promise.all(uploadPromises);
        const validResults = results.filter(url => url !== null) as string[];
        
        if (validResults.length > 0) {
          onChangeFotosSaida([...fotosSaida, ...validResults]);
          toast.success(`${validResults.length} arquivo(s) carregado(s) com sucesso!`);
        } 
        
        if (validResults.length < newFiles.length) {
          setUploadError(`Falha ao fazer upload de ${newFiles.length - validResults.length} arquivo(s). Verifique as permissões de acesso ao Storage.`);
        }
      } else {
        onChangeFotosSaida([...fotosSaida, ...newFiles]);
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      setUploadError("Erro ao processar arquivos. Verifique as permissões de acesso ao Storage.");
      toast.error("Erro ao processar arquivos");
    }
  };

  // Função para abrir o seletor de arquivo e selecionar múltiplos arquivos
  const handleSelectMultipleFiles = () => {
    if (activeTab === "entrada" && entradaInputRef.current) {
      entradaInputRef.current.click();
    } else if (activeTab === "saida" && saidaInputRef.current) {
      saidaInputRef.current.click();
    }
  };

  // Função para remover arquivo de entrada
  const handleRemoveFotoEntrada = async (index: number) => {
    const foto = fotosEntrada[index];
    const newFotos = [...fotosEntrada];
    newFotos.splice(index, 1);
    onChangeFotosEntrada(newFotos);

    if (typeof foto === 'string' && foto.startsWith('http')) {
      try {
        await deleteFile(foto);
        toast.success("Arquivo removido com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir arquivo:", error);
      }
    }
    
    // Limpa a seleção
    setSelectedFiles(new Set());
  };

  // Função para remover arquivo de saída
  const handleRemoveFotoSaida = async (index: number) => {
    const foto = fotosSaida[index];
    const newFotos = [...fotosSaida];
    newFotos.splice(index, 1);
    onChangeFotosSaida(newFotos);

    if (typeof foto === 'string' && foto.startsWith('http')) {
      try {
        await deleteFile(foto);
        toast.success("Arquivo removido com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir arquivo:", error);
      }
    }
    
    // Limpa a seleção
    setSelectedFiles(new Set());
  };
  
  // Toggle para selecionar/deselecionar arquivo
  const toggleFileSelection = (index: number) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedFiles(newSelection);
  };
  
  // Função para remover todos os arquivos selecionados
  const removeSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    const arquivosSelecionados = Array.from(selectedFiles).sort((a, b) => b - a);
    
    if (activeTab === "entrada") {
      // Cria uma cópia para modificação
      const newFotosEntrada = [...fotosEntrada];
      
      // Remove cada arquivo selecionado
      for (const index of arquivosSelecionados) {
        const foto = fotosEntrada[index];
        
        // Se for URL, tenta excluir do storage
        if (typeof foto === 'string' && foto.startsWith('http')) {
          await deleteFile(foto);
        }
        
        // Remove do array
        newFotosEntrada.splice(index, 1);
      }
      
      onChangeFotosEntrada(newFotosEntrada);
    } else {
      // Cria uma cópia para modificação
      const newFotosSaida = [...fotosSaida];
      
      // Remove cada arquivo selecionado
      for (const index of arquivosSelecionados) {
        const foto = fotosSaida[index];
        
        // Se for URL, tenta excluir do storage
        if (typeof foto === 'string' && foto.startsWith('http')) {
          await deleteFile(foto);
        }
        
        // Remove do array
        newFotosSaida.splice(index, 1);
      }
      
      onChangeFotosSaida(newFotosSaida);
    }
    
    toast.success(`${selectedFiles.size} arquivo(s) removido(s) com sucesso!`);
    
    // Limpa seleção
    setSelectedFiles(new Set());
  };

  // Gerar previews de arquivos
  const renderFilePreview = (file: any, index: number, isEntrada: boolean) => {
    const isSelected = selectedFiles.has(index);
    let previewUrl = '';
    let fileType = 'other';
    
    if (typeof file === 'string') {
      previewUrl = file;
      fileType = isImage(file) ? 'image' : isVideo(file) ? 'video' : 'other';
    } else if (file instanceof File) {
      previewUrl = URL.createObjectURL(file);
      fileType = isImage(file) ? 'image' : isVideo(file) ? 'video' : 'other';
    }
    
    return (
      <Card 
        key={index} 
        className={`relative overflow-hidden transition-all cursor-pointer h-48 ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        onClick={() => toggleFileSelection(index)}
      >
        <CardContent className="p-0 h-full">
          {fileType === 'image' && (
            <img 
              src={previewUrl} 
              alt={`Arquivo ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Erro ao carregar imagem:", previewUrl);
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          )}
          
          {fileType === 'video' && (
            <video 
              src={previewUrl} 
              className="w-full h-full object-contain"
              controls
            />
          )}
          
          {fileType === 'other' && (
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-sm text-muted-foreground">Arquivo não suportado para preview</p>
            </div>
          )}
          
          {/* Badge para mostrar o tipo de arquivo */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 z-10"
          >
            {fileType === 'image' ? 'Imagem' : fileType === 'video' ? 'Vídeo' : 'Arquivo'}
          </Badge>
          
          {/* Indicador de seleção */}
          {isSelected && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <div className="bg-primary text-primary-foreground rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {uploadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {/* Exibição do espaço de armazenamento usado */}
      {storageStats && (
        <div className="mb-4 p-4 bg-muted rounded-md">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Espaço utilizado</span>
            <span className="text-sm">
              {formatStorageSize(storageStats.used)} / {formatStorageSize(storageStats.total)}
            </span>
          </div>
          <Progress value={storageStats.percentage} className="h-2" />
        </div>
      )}
      
      <Tabs 
        defaultValue="entrada" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="entrada" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Arquivos de Entrada
          </TabsTrigger>
          <TabsTrigger value="saida" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Arquivos de Saída
          </TabsTrigger>
        </TabsList>
        
        {/* Botões de ação para arquivos */}
        <div className="flex justify-between mb-4">
          <Button 
            variant="outline" 
            onClick={handleSelectMultipleFiles}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {activeTab === "entrada" ? "Adicionar arquivos de entrada" : "Adicionar arquivos de saída"}
          </Button>
          
          {selectedFiles.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={removeSelectedFiles}
              disabled={isUploading}
            >
              <Trash className="h-4 w-4 mr-2" />
              Remover selecionados ({selectedFiles.size})
            </Button>
          )}
        </div>
        
        {/* Input file oculto para entrada */}
        <input
          type="file"
          ref={entradaInputRef}
          className="sr-only"
          onChange={(e) => handleAddMultipleFotosEntrada(e.target.files)}
          accept="image/*,video/*"
          multiple
        />
        
        {/* Input file oculto para saída */}
        <input
          type="file"
          ref={saidaInputRef}
          className="sr-only"
          onChange={(e) => handleAddMultipleFotosSaida(e.target.files)}
          accept="image/*,video/*"
          multiple
        />
        
        <TabsContent value="entrada" className="space-y-4">
          {fotosEntrada.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fotosEntrada.map((foto, index) => 
                renderFilePreview(foto, index, true)
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-md">
              <Gallery className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum arquivo de entrada adicionado.</p>
              <Button 
                variant="link" 
                onClick={handleSelectMultipleFiles} 
                className="mt-2"
                disabled={isUploading}
              >
                Adicionar arquivos
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saida" className="space-y-4">
          {fotosSaida.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fotosSaida.map((foto, index) => 
                renderFilePreview(foto, index, false)
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-md">
              <Gallery className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum arquivo de saída adicionado.</p>
              <Button 
                variant="link" 
                onClick={handleSelectMultipleFiles} 
                className="mt-2"
                disabled={isUploading}
              >
                Adicionar arquivos
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
