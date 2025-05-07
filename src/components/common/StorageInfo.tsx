
import React from "react";
import { useStorage } from "@/hooks/useStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

export function StorageInfo() {
  const { storageInfo, fetchStorageInfo } = useStorage();
  
  // Format bytes to human readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  React.useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);
  
  if (!storageInfo) return null;
  
  const usedSpace = storageInfo.bytesUsed;
  const totalSpace = storageInfo.maxSize;
  const usagePercentage = Math.round((usedSpace / totalSpace) * 100);
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center">
          <HardDrive className="mr-2 h-5 w-5" />
          Armazenamento
        </CardTitle>
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
