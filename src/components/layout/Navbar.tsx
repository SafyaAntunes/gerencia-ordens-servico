
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type NavbarProps = {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
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
          
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className="text-xl font-semibold text-primary">
              SGR
            </Link>
            <span className="text-xs text-muted-foreground">
              Sistema de Gestão de Retíficas
            </span>
          </div>
        </div>

        <div className="relative hidden md:flex w-full max-w-md mx-4">
          <Input
            type="search"
            placeholder="Buscar ordens, clientes..."
            className="pl-10 pr-4 py-2 rounded-full border border-input bg-background/60 backdrop-blur-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative animate-fade-in">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-white">
              3
            </span>
          </Button>
          
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            AD
          </div>
        </div>
      </div>
    </nav>
  );
}
