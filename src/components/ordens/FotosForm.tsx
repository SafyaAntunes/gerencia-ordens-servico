
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { Camera, Upload, AlertTriangle, Trash, Images } from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const { uploadFiles, deleteFile, storageInfo } = useStorage();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: boolean}>({});
  
  const handleAddFotosEntrada = async (files: File[] | null) => {
    if (files && files.length > 0) {
      try {
        setUploadError(null);
        if (ordemId !== "temp") {
          const urls = await uploadFiles(files, `ordens/${ordemId}/entrada`);
          if (urls.length > 0) {
            onChangeFotosEntrada([...fotosEntrada, ...urls]);
            toast.success(`${urls.length} arquivos carregados com sucesso!`);
          } else {
            setUploadError("Falha ao fazer upload das imagens. Verifique as permissões de acesso ao Storage.");
          }
        } else {
          onChangeFotosEntrada([...fotosEntrada, ...files]);
        }
      } catch (error) {
        console.error("Erro no upload:", error);
        setUploadError("Erro ao processar arquivos. Verifique as permissões de acesso ao Storage.");
        toast.error("Erro ao processar arquivos");
      }
    }
  };

  const handleAddFotosSaida = async (files: File[] | null) => {
    if (files && files.length > 0) {
      try {
        setUploadError(null);
        if (ordemId !== "temp") {
          const urls = await uploadFiles(files, `ordens/${ordemId}/saida`);
          if (urls.length > 0) {
            onChangeFotosSaida([...fotosSaida, ...urls]);
            toast.success(`${urls.length} arquivos carregados com sucesso!`);
          } else {
            setUploadError("Falha ao fazer upload das imagens. Verifique as permissões de acesso ao Storage.");
          }
        } else {
          onChangeFotosSaida([...fotosSaida, ...files]);
        }
      } catch (error) {
        console.error("Erro no upload:", error);
        setUploadError("Erro ao processar arquivos. Verifique as permissões de acesso ao Storage.");
        toast.error("Erro ao processar arquivos");
      }
    }
  };

  const handleRemoveFotosEntrada = async () => {
    const selectedKeys = Object.keys(selectedFiles).filter(key => selectedFiles[key]);
    if (selectedKeys.length === 0) return;
    
    const newFotos = [...fotosEntrada];
    const deletedIndices: number[] = [];
    
    // Tentar excluir arquivos do storage
    for (const key of selectedKeys) {
      const index = parseInt(key.replace('entrada-', ''));
      const foto = fotosEntrada[index];
      
      if (typeof foto === 'string' && foto.startsWith('http')) {
        try {
          await deleteFile(foto);
        } catch (error) {
          console.error("Erro ao excluir arquivo:", error);
        }
      }
      
      deletedIndices.push(index);
    }
    
    // Remover arquivos do array de fotos na ordem inversa
    // para evitar problemas de índice ao remover múltiplos itens
    deletedIndices
      .sort((a, b) => b - a) // Ordem decrescente
      .forEach(index => {
        newFotos.splice(index, 1);
      });
    
    onChangeFotosEntrada(newFotos);
    setSelectedFiles({});
    toast.success(`${selectedKeys.length} arquivos removidos`);
  };

  const handleRemoveFotosSaida = async () => {
    const selectedKeys = Object.keys(selectedFiles).filter(key => selectedFiles[key]);
    if (selectedKeys.length === 0) return;
    
    const newFotos = [...fotosSaida];
    const deletedIndices: number[] = [];
    
    // Tentar excluir arquivos do storage
    for (const key of selectedKeys) {
      const index = parseInt(key.replace('saida-', ''));
      const foto = fotosSaida[index];
      
      if (typeof foto === 'string' && foto.startsWith('http')) {
        try {
          await deleteFile(foto);
        } catch (error) {
          console.error("Erro ao excluir arquivo:", error);
        }
      }
      
      deletedIndices.push(index);
    }
    
    // Remover arquivos do array de fotos na ordem inversa
    deletedIndices
      .sort((a, b) => b - a)
      .forEach(index => {
        newFotos.splice(index, 1);
      });
    
    onChangeFotosSaida(newFotos);
    setSelectedFiles({});
    toast.success(`${selectedKeys.length} arquivos removidos`);
  };

  const toggleFileSelection = (type: 'entrada' | 'saida', index: number) => {
    const key = `${type}-${index}`;
    setSelectedFiles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const countSelectedFiles = (type: 'entrada' | 'saida') => {
    return Object.keys(selectedFiles).filter(key => 
      key.startsWith(`${type}-`) && selectedFiles[key]
    ).length;
  };

  const entriesSelected = countSelectedFiles('entrada');
  const exitSelected = countSelectedFiles('saida');

  return (
    <div>
      {uploadError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
      
      {storageInfo && (
        <div className="mb-4 p-3 bg-muted rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Espaço utilizado:</span>
            <Badge variant="outline">
              {(storageInfo.bytesUsed / (1024 * 1024)).toFixed(2)} MB / {(storageInfo.maxSize / (1024 * 1024)).toFixed(0)} MB
            </Badge>
          </div>
          <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${(storageInfo.bytesUsed / storageInfo.maxSize) * 100}%` }}
            />
          </div>
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
            {entriesSelected > 0 && (
              <Badge variant="secondary" className="ml-1">{entriesSelected}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="saida" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Arquivos de Saída
            {exitSelected > 0 && (
              <Badge variant="secondary" className="ml-1">{exitSelected}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="entrada" className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">
              {fotosEntrada.length} arquivo(s)
            </h3>
            {entriesSelected > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRemoveFotosEntrada}
                className="flex items-center gap-1"
              >
                <Trash className="h-4 w-4" />
                Remover selecionados
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fotosEntrada.map((foto, index) => (
              <FileUpload
                key={`entrada-${index}`}
                value={foto}
                isSelected={!!selectedFiles[`entrada-${index}`]}
                onSelect={() => toggleFileSelection('entrada', index)}
                accept="image/*,video/*"
              />
            ))}
            <FileUpload 
              onChange={handleAddFotosEntrada} 
              accept="image/*,video/*" 
              multiple={true}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="saida" className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">
              {fotosSaida.length} arquivo(s)
            </h3>
            {exitSelected > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleRemoveFotosSaida}
                className="flex items-center gap-1"
              >
                <Trash className="h-4 w-4" />
                Remover selecionados
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {fotosSaida.map((foto, index) => (
              <FileUpload
                key={`saida-${index}`}
                value={foto}
                isSelected={!!selectedFiles[`saida-${index}`]}
                onSelect={() => toggleFileSelection('saida', index)}
                accept="image/*,video/*"
              />
            ))}
            <FileUpload 
              onChange={handleAddFotosSaida} 
              accept="image/*,video/*" 
              multiple={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
