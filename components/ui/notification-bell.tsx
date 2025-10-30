'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { NotificacaoService } from '@/lib/services/notificacao.service';
import { Notificacao } from '@/types';
import Link from 'next/link';

export function NotificationBell() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    carregarNotificacoes();

    // Verificar notificações a cada 30 segundos
    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const carregarNotificacoes = async () => {
    try {
      // TODO: Pegar usuário do contexto
      const userId = 'user-id';

      const notificacoesList = await NotificacaoService.listar(userId, 10);
      setNotificacoes(notificacoesList);

      const qtdNaoLidas = notificacoesList.filter(n => !n.lida).length;
      setNaoLidas(qtdNaoLidas);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      await NotificacaoService.marcarComoLida(id);
      await carregarNotificacoes();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      // TODO: Pegar usuário do contexto
      const userId = 'user-id';

      await NotificacaoService.marcarTodasComoLidas(userId);
      await carregarNotificacoes();
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      await NotificacaoService.excluir(id);
      await carregarNotificacoes();
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  const getPrioridadeColor = (prioridade: Notificacao['prioridade']) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo: Notificacao['tipo']) => {
    switch (tipo) {
      case 'prazo':
        return '⏰';
      case 'transgressao':
        return '⚠️';
      case 'sindicancia':
        return '📋';
      case 'comportamento':
        return '📊';
      default:
        return '📌';
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLidas}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notificacoes.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            notificacoes.map((notificacao) => (
              <div
                key={notificacao.id}
                className={`p-3 border-b hover:bg-gray-50 ${
                  !notificacao.lida ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getTipoIcon(notificacao.tipo)}</span>
                      <h4 className="font-medium text-sm">{notificacao.titulo}</h4>
                      <Badge
                        className={`text-xs ${getPrioridadeColor(notificacao.prioridade)}`}
                      >
                        {notificacao.prioridade}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{notificacao.mensagem}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {format(notificacao.createdAt, 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                      <div className="flex items-center gap-1">
                        {notificacao.link && (
                          <Link href={notificacao.link}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setOpen(false)}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                        {!notificacao.lida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => marcarComoLida(notificacao.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => excluirNotificacao(notificacao.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}