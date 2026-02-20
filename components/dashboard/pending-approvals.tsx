'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCheck, UserX, Clock, Shield, Loader2 } from 'lucide-react';
import { AprovacaoService } from '@/lib/services/aprovacao.service';
import { useAuth } from '@/contexts/AuthContext';
import { Usuario } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export function PendingApprovals() {
  const { user, userData } = useAuth();
  const [pendentes, setPendentes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (userData?.perfil !== 'admin') {
      setLoading(false);
      return;
    }

    const unsubscribe = AprovacaoService.onPendentesChange((users) => {
      setPendentes(users);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.perfil]);

  const handleAprovar = async (userId: string) => {
    try {
      setActionLoading(userId);
      await AprovacaoService.aprovar(
        userId,
        user!.uid,
        `${userData?.patente} ${userData?.nome}`
      );
      toast.success('Usuário aprovado com sucesso!');
    } catch {
      toast.error('Erro ao aprovar usuário');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejeitar = async () => {
    if (!rejectDialog.userId) return;
    try {
      setActionLoading(rejectDialog.userId);
      await AprovacaoService.rejeitar(rejectDialog.userId, rejectReason);
      toast.success('Usuário rejeitado');
      setRejectDialog({ open: false, userId: null });
      setRejectReason('');
    } catch {
      toast.error('Erro ao rejeitar usuário');
    } finally {
      setActionLoading(null);
    }
  };

  // Só mostra para admins e quando há pendentes
  if (userData?.perfil !== 'admin' || (pendentes.length === 0 && !loading)) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-yellow-200 bg-yellow-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Shield className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-gray-900">Solicitações de Acesso Pendentes</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {pendentes.map((pendente) => (
                    <motion.div
                      key={pendente.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      layout
                      className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={pendente.fotoURL || ''} />
                          <AvatarFallback className="bg-slate-100 text-slate-600">
                            {pendente.nome?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{pendente.nome || 'Nome não informado'}</p>
                          <p className="text-xs text-gray-500 truncate">{pendente.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {pendente.patente && (
                              <Badge variant="outline" className="text-xs">
                                {pendente.patente}
                              </Badge>
                            )}
                            {pendente.unidade && (
                              <span className="text-xs text-gray-400">{pendente.unidade}</span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {pendente.createdAt && format(pendente.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {pendente.provedor === 'google' ? 'Google' : 'Email'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleAprovar(pendente.id)}
                          disabled={actionLoading === pendente.id}
                        >
                          {actionLoading === pendente.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Aprovar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => setRejectDialog({ open: true, userId: pendente.id })}
                          disabled={actionLoading === pendente.id}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog de Rejeição */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open) => {
        setRejectDialog({ open, userId: open ? rejectDialog.userId : null });
        if (!open) setRejectReason('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Solicitação de Acesso</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. O usuário será desativado e não poderá acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="motivo">Motivo</Label>
            <Input
              id="motivo"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Usuário não pertence à unidade"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejeitar}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
