
import React, { useState } from "react";
import { useStorage } from "@/hooks/useStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StorageInfoProps {
  className?: string;
  showRefreshButton?: boolean;
}

export function StorageInfo({ className, showRefreshButton = true }: StorageInfoProps) {
  const { storageInfo, fetchStorageInfo } = useStorage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchStorageInfo();
      toast.success("Informações de armazenamento atualizadas");
    } catch (error) {
      toast.error("Erro ao atualizar informações de armazenamento");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  React.useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);
  
  if (!storageInfo) return null;
  
  const usedSpace = storageInfo.bytesUsed;
  const totalSpace = storageInfo.maxSize;
  const usagePercentage = Math.round((usedSpace / totalSpace) * 100);
  
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-md flex items-center">
          <HardDrive className="mr-2 h-5 w-5" />
          Armazenamento
        </CardTitle>
        {showRefreshButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span>Espaço utilizado:</span>
            <span className="font-medium">{formatBytes(usedSpace)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>Espaço disponível:</span>
            <span className="font-medium">{formatBytes(totalSpace - usedSpace)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>Total:</span>
            <span className="font-medium">{formatBytes(totalSpace)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span>Arquivos:</span>
            <span className="font-medium">{storageInfo.fileCount}</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span>Uso:</span>
              <span className="font-medium">{usagePercentage}%</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
