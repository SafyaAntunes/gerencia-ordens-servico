
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OrdemPaginationControlsProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const OrdemPaginationControls: React.FC<OrdemPaginationControlsProps> = ({
  loading,
  hasMore,
  onLoadMore
}) => {
  return (
    <div className="w-full flex justify-center mt-4 mb-8">
      {hasMore && (
        <Button 
          variant="outline" 
          onClick={onLoadMore} 
          disabled={loading}
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            "Carregar mais"
          )}
        </Button>
      )}
    </div>
  );
};

export default OrdemPaginationControls;
