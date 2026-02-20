'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, Shield, Building2, Mail } from 'lucide-react';

export function UserWelcome() {
  const { user, userData } = useAuth();

  if (!userData) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const perfilLabel = () => {
    switch (userData.perfil) {
      case 'admin': return 'Administrador';
      case 'consulta': return 'Consulta';
      default: return 'Usuário';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-6 flex-wrap">
            <Avatar className="h-16 w-16 ring-2 ring-red-500 ring-offset-2 ring-offset-slate-900 flex-shrink-0">
              <AvatarImage src={userData.fotoURL || user?.photoURL || ''} />
              <AvatarFallback className="bg-red-600 text-white text-xl">
                {userData.nome?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-sm">{greeting()},</p>
              <h2 className="text-2xl font-bold truncate">
                {userData.patente} {userData.nome}
              </h2>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {userData.unidade && (
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{userData.unidade}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{userData.email}</span>
                </div>
                {userData.lastLogin && (
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    Último acesso: {format(userData.lastLogin, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <Badge className="bg-red-600 text-white hover:bg-red-600">
                <Shield className="h-3 w-3 mr-1" />
                {perfilLabel()}
              </Badge>
              {userData.provedor && (
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {userData.provedor === 'google' ? 'Google' : 'Email/Senha'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
