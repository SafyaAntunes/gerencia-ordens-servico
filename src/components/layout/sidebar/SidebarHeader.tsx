
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SidebarHeaderProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
};

const SidebarHeader = ({ 
  isCollapsed = false, 
  onToggleCollapse, 
  onClose, 
  isMobile = false 
}: SidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4">
      {!isCollapsed && (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="font-bold text-white">SGR</span>
          </div>
          <span className="font-semibold">Sistema de Gestão</span>
        </div>
      )}
      {isCollapsed && (
        <div className="mx-auto h-8 w-8 rounded bg-primary flex items-center justify-center">
          <span className="font-bold text-white">SGR</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={isMobile ? onClose : onToggleCollapse}
        className={`${!isMobile ? `transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}` : ''}`}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SidebarHeader;
