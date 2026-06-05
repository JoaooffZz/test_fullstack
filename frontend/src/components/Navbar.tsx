import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { LogOut, LayoutDashboard, FileText, Layers, HardHat, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, company, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[6px] transition-premium ${
      isActive(path)
        ? 'bg-canvas-soft text-ink border border-hairline'
        : 'text-ink-mute hover:text-ink hover:bg-canvas-soft/50 border border-transparent'
    }`;

  return (
    <nav className="border-b border-hairline bg-canvas sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link to="/" className="text-lg font-bold tracking-tight text-ink flex items-center gap-1">
          Supabaze<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span><span className="text-ink-mute font-medium text-xs border border-hairline px-1.5 py-0.5 rounded-[4px]">ERP</span>
        </Link>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        <Link to="/" className={navItemClass('/')}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link to="/contratos" className={navItemClass('/contratos')}>
          <FileText className="w-4 h-4" />
          Contratos
        </Link>
        <Link to="/templates" className={navItemClass('/templates')}>
          <Layers className="w-4 h-4" />
          Modelos
        </Link>
        <Link to="/obras" className={navItemClass('/obras')}>
          <HardHat className="w-4 h-4" />
          Obras
        </Link>
        <Link to="/usuarios" className={navItemClass('/usuarios')}>
          <Users className="w-4 h-4" />
          Usuários
        </Link>
      </div>

      {/* User Info / Logout */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-ink-secondary">{user?.name}</div>
          <div className="text-[10px] text-ink-mute-2">{company?.name}</div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center justify-center p-2 text-ink-mute hover:text-accent-tomato hover:bg-canvas-soft rounded-[6px] border border-transparent hover:border-hairline transition-premium cursor-pointer"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
