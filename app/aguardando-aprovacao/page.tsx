'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Clock, LogOut, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AguardandoAprovacaoPage() {
  const { user, userData, isApproved, isProfileComplete, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!isProfileComplete) {
      router.push('/completar-perfil');
      return;
    }

    if (isApproved) {
      router.push('/');
      return;
    }
  }, [user, isApproved, isProfileComplete, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-slate-700/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userData?.fotoURL || user?.photoURL || ''} />
                <AvatarFallback className="bg-slate-700 text-white text-lg">
                  {userData?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-yellow-500 rounded-full">
                <Clock className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Aguardando Aprovação
          </CardTitle>
          <CardDescription className="text-slate-400">
            Olá, {userData?.nome || user?.displayName || 'usuário'}!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex justify-center mb-3">
              <div className="p-2 bg-yellow-500/10 rounded-full">
                <Shield className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Seu cadastro foi realizado com sucesso. Um administrador do sistema
              precisa aprovar seu acesso antes que você possa utilizar a plataforma.
            </p>
          </div>

          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-yellow-400 text-xs">
              Você será notificado quando seu acesso for aprovado.
              Tente novamente em alguns minutos.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar novamente
            </Button>
            <Button
              variant="ghost"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/20"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
