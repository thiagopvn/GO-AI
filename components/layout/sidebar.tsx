'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Search,
  Settings,
  Shield,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  UserCheck,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/'
  },
  {
    title: 'Militares',
    icon: Users,
    href: '/militares'
  },
  {
    title: 'Comportamento',
    icon: UserCheck,
    href: '/comportamento'
  },
  {
    title: 'Processos (PAD)',
    icon: FileText,
    href: '/processos'
  },
  {
    title: 'Sindicâncias',
    icon: Search,
    href: '/sindicancias'
  },
  {
    title: 'Permutas',
    icon: ArrowLeftRight,
    href: '/permutas'
  },
  {
    title: 'Relatórios',
    icon: BarChart3,
    href: '/relatorios'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/configuracoes'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { userData, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  };

  return (
    <aside
      className={cn(
        'h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center space-x-3', isCollapsed && 'justify-center')}>
            <div className="p-2 bg-red-600 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg">CBMERJ</h1>
                <p className="text-xs text-slate-400">Gestão Disciplinar</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-slate-800"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {userData && (
        <div className="p-4 border-b border-slate-800">
          {isCollapsed ? (
            <div className="flex justify-center">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData.fotoURL || ''} />
                <AvatarFallback className="bg-slate-700 text-white text-sm">
                  {getInitials(userData.nome)}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={userData.fotoURL || ''} />
                <AvatarFallback className="bg-slate-700 text-white text-sm">
                  {getInitials(userData.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{userData.nome}</p>
                <p className="text-sm text-slate-400">{userData.patente}</p>
                <p className="text-xs text-slate-500 truncate">{userData.unidade}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full text-slate-300 hover:bg-slate-800 hover:text-white',
            isCollapsed ? 'px-0 justify-center' : 'justify-start'
          )}
        >
          <LogOut className="h-5 w-5 mr-3" />
          {!isCollapsed && 'Sair'}
        </Button>
      </div>
    </aside>
  );
}
