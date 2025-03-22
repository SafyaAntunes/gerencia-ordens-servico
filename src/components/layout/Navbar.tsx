
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavbarProps = {
  toggleSidebar: () => void;
  onLogout?: () => void;
}

export default function Navbar({ toggleSidebar, onLogout }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 ${
        scrolled 
          ? 'glassmorphism shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-semibold text-primary">
              SGR
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative animate-fade-in"
            onClick={() => {}}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-white">
              3
            </span>
          </Button>
          
          {onLogout && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onLogout}
              className="ml-2"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
          
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            AD
          </div>
        </div>
      </div>
    </nav>
  );
}
