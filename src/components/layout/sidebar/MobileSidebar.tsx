
import { motion } from 'framer-motion';
import SidebarHeader from './SidebarHeader';
import NavigationLinks from './NavigationLinks';

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  const sidebarVariants = {
    open: { 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    closed: { 
      x: "-100%",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    }
  };

  const mobileClass = isOpen ? "block lg:hidden" : "hidden";
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full z-50 bg-sidebar w-64 shadow-xl ${mobileClass}`}
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
      >
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
          <SidebarHeader onClose={onClose} isMobile={true} />
          <NavigationLinks isCollapsed={false} />
        </div>
      </motion.aside>
    </>
  );
};

export default MobileSidebar;
