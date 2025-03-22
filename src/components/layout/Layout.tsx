
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="pt-20 pb-6 px-4 lg:pl-72">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
