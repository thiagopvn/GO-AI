'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './sidebar';
import { Loader2, LogOut, User } from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MainLayoutProps {
  children: ReactNode;
}

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/register', '/forgot-password', '/aguardando-aprovacao', '/completar-perfil'];

export function MainLayout({ children }: MainLayoutProps) {
  const { user, userData, loading, logout, isApproved, isProfileComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handlePerfil = () => {
    router.push('/configuracoes');
  };

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }

    if (user && !isPublicRoute) {
      // Perfil incompleto (usuários Google)
      if (!isProfileComplete) {
        router.push('/completar-perfil');
        return;
      }
      // Não aprovado
      if (!isApproved) {
        router.push('/aguardando-aprovacao');
        return;
      }
    }
  }, [user, loading, router, pathname, isApproved, isProfileComplete]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se for rota pública ou não estiver autenticado, renderizar apenas o children
  if (publicRoutes.includes(pathname) || !user) {
    return <>{children}</>;
  }

  // Se não aprovado ou perfil incompleto, não renderizar o layout principal
  if (!isApproved || !isProfileComplete) {
    return <>{children}</>;
  }

  // Layout principal para usuários autenticados e aprovados
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-xl font-semibold text-gray-800">
              Sistema de Gestão Disciplinar
            </h1>
            <div className="flex items-center gap-4">
              {/* Sino de Notificações */}
              <NotificationBell />

              {/* Menu do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData?.fotoURL || user?.photoURL || ''} alt={userData?.nome || ''} />
                      <AvatarFallback>
                        {userData?.nome?.charAt(0)?.toUpperCase() || user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData?.nome || user?.displayName || 'Usuário'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userData?.patente}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePerfil} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
