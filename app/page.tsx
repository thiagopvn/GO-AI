'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  FileText,
  Search,
  AlertTriangle,
  Users,
  FileCheck,
  SearchCheck,
  ExternalLink
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StatusProcesso, TipoProcesso, Militar, Sindicancia, ProcessoDisciplinar } from '@/types';
import { format, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

// Lazy load componentes pesados
const Timeline = dynamic(() => import('@/components/dashboard/timeline').then(mod => ({ default: mod.Timeline })), {
  loading: () => <div className="bg-white rounded-lg shadow p-6 h-[400px] animate-pulse" />,
  ssr: false
});

const ComportamentoChart = dynamic(() => import('@/components/dashboard/comportamento-chart').then(mod => ({ default: mod.ComportamentoChart })), {
  loading: () => <div className="bg-white rounded-lg shadow p-6 h-[400px] animate-pulse" />,
  ssr: false
});

const Dialog = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })));
const DialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogContent })));
const DialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogHeader })));
const DialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogTitle })));
const ScrollArea = dynamic(() => import('@/components/ui/scroll-area').then(mod => ({ default: mod.ScrollArea })));

interface ModalData {
  pads: ProcessoDisciplinar[];
  sindicancias: Sindicancia[];
  militares: Militar[];
  reincidentes: { militar: Militar; totalTransgressoes: number }[];
}

export default function Home() {
  const { stats, loading } = useRealtimeStats();
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ModalData>({
    pads: [],
    sindicancias: [],
    militares: [],
    reincidentes: []
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchModalData = useCallback(async (modalKey: string) => {
    setModalLoading(true);
    try {
      switch (modalKey) {
        case 'padsFinalizados': {
          const q = query(
            collection(db, 'processos'),
            where('tipo', '==', TipoProcesso.PAD),
            where('status', '==', StatusProcesso.FINALIZADO),
            limit(50)
          );
          const snapshot = await getDocs(q);
          const pads = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dataAbertura: data.dataAbertura?.toDate?.() || data.createdAt?.toDate?.(),
              dataFechamento: data.dataFechamento?.toDate?.(),
              prazoDefesa: data.prazoDefesa?.toDate?.()
            } as ProcessoDisciplinar;
          });
          setModalData(prev => ({ ...prev, pads }));
          break;
        }
        case 'padsEmAndamento': {
          const q = query(
            collection(db, 'processos'),
            where('tipo', '==', TipoProcesso.PAD),
            where('status', '==', StatusProcesso.EM_ANDAMENTO),
            limit(50)
          );
          const snapshot = await getDocs(q);
          const pads = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dataAbertura: data.dataAbertura?.toDate?.() || data.createdAt?.toDate?.(),
              prazoDefesa: data.prazoDefesa?.toDate?.(),
              prazoVencido: data.prazoVencido,
              respostaRecebida: data.respostaRecebida
            } as ProcessoDisciplinar;
          });
          // Ordenar por prazo de defesa (mais urgentes primeiro)
          pads.sort((a, b) => {
            if (!a.prazoDefesa) return 1;
            if (!b.prazoDefesa) return -1;
            return a.prazoDefesa.getTime() - b.prazoDefesa.getTime();
          });
          setModalData(prev => ({ ...prev, pads }));
          break;
        }
        case 'sindicanciasFinalizadas': {
          const q = query(
            collection(db, 'sindicancias'),
            where('status', '==', 'Concluída'),
            limit(50)
          );
          const snapshot = await getDocs(q);
          const sindicancias = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              numero: data.numero || '',
              tipo: data.tipo || 'Sindicância',
              encarregadoId: data.encarregadoId || '',
              encarregadoNome: data.encarregadoNome || '',
              encarregadoPosto: data.encarregadoPosto || '',
              militarInvestigadoId: data.militarInvestigadoId || '',
              militarInvestigadoNome: data.militarInvestigadoNome || '',
              assunto: data.assunto || data.militarInvestigadoNome || 'N/A',
              dataInstauracao: data.dataInstauracao?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
              prazoInicial: data.prazoInicial || 20,
              prorrogacoes: data.prorrogacoes || 0,
              dataLimite: data.dataLimite?.toDate?.() || new Date(),
              status: data.status,
              observacoes: data.observacoes || '',
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              createdBy: data.createdBy || ''
            } as Sindicancia;
          });
          setModalData(prev => ({ ...prev, sindicancias }));
          break;
        }
        case 'sindicanciasEmAndamento': {
          const q = query(
            collection(db, 'sindicancias'),
            where('status', '==', 'Em Andamento'),
            limit(50)
          );
          const snapshot = await getDocs(q);
          const sindicancias = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              numero: data.numero || '',
              tipo: data.tipo || 'Sindicância',
              encarregadoId: data.encarregadoId || '',
              encarregadoNome: data.encarregadoNome || '',
              encarregadoPosto: data.encarregadoPosto || '',
              militarInvestigadoId: data.militarInvestigadoId || '',
              militarInvestigadoNome: data.militarInvestigadoNome || '',
              assunto: data.assunto || data.militarInvestigadoNome || 'N/A',
              dataInstauracao: data.dataInstauracao?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
              prazoInicial: data.prazoInicial || 20,
              prorrogacoes: data.prorrogacoes || 0,
              dataLimite: data.dataLimite?.toDate?.() || new Date(),
              status: data.status,
              observacoes: data.observacoes || '',
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
              createdBy: data.createdBy || ''
            } as Sindicancia;
          });
          setModalData(prev => ({ ...prev, sindicancias }));
          break;
        }
        case 'militares': {
          const q = query(
            collection(db, 'militares'),
            orderBy('nome', 'asc'),
            limit(100)
          );
          const snapshot = await getDocs(q);
          const militares = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Militar));
          setModalData(prev => ({ ...prev, militares }));
          break;
        }
        case 'reincidentes': {
          // Buscar transgressões e agrupar por militar
          const transgressoesSnapshot = await getDocs(collection(db, 'transgressoes'));
          const transgressoesPorMilitar: Record<string, { count: number; militarNome: string; militarPosto: string }> = {};

          transgressoesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.militarId) {
              if (!transgressoesPorMilitar[data.militarId]) {
                transgressoesPorMilitar[data.militarId] = {
                  count: 0,
                  militarNome: data.militarNome || 'N/A',
                  militarPosto: data.militarPosto || 'N/A'
                };
              }
              transgressoesPorMilitar[data.militarId].count++;
              if (data.militarNome) {
                transgressoesPorMilitar[data.militarId].militarNome = data.militarNome;
              }
              if (data.militarPosto) {
                transgressoesPorMilitar[data.militarId].militarPosto = data.militarPosto;
              }
            }
          });

          const reincidentes = Object.entries(transgressoesPorMilitar)
            .filter(([, data]) => data.count > 1)
            .map(([militarId, data]) => ({
              militar: {
                id: militarId,
                nome: data.militarNome,
                patente: data.militarPosto
              } as Militar,
              totalTransgressoes: data.count
            }))
            .sort((a, b) => b.totalTransgressoes - a.totalTransgressoes);

          setModalData(prev => ({ ...prev, reincidentes }));
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do modal:', error);
    } finally {
      setModalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedModal) {
      fetchModalData(selectedModal);
    }
  }, [selectedModal, fetchModalData]);

  const statsConfig = [
    {
      title: 'PADs Finalizados',
      value: stats.padsFinalizados,
      icon: FileCheck,
      color: 'green' as const,
      description: 'Processos concluídos',
      modalKey: 'padsFinalizados'
    },
    {
      title: 'PADs em Andamento',
      value: stats.padsEmAndamento,
      icon: FileText,
      color: 'blue' as const,
      description: 'Processos ativos',
      modalKey: 'padsEmAndamento'
    },
    {
      title: 'Sindicâncias Finalizadas',
      value: stats.sindicanciasFinalizadas,
      icon: SearchCheck,
      color: 'green' as const,
      description: 'Investigações concluídas',
      modalKey: 'sindicanciasFinalizadas'
    },
    {
      title: 'Sindicâncias em Andamento',
      value: stats.sindicanciasEmAndamento,
      icon: Search,
      color: 'yellow' as const,
      description: 'Investigações ativas',
      modalKey: 'sindicanciasEmAndamento'
    },
    {
      title: 'Total de Militares',
      value: stats.totalMilitares,
      icon: Users,
      color: 'purple' as const,
      description: 'Efetivo total',
      modalKey: 'militares'
    },
    {
      title: 'Militares Reincidentes',
      value: stats.totalReincidentes,
      icon: AlertTriangle,
      color: 'red' as const,
      description: 'Com múltiplas transgressões',
      modalKey: 'reincidentes'
    }
  ];

  const renderModalContent = () => {
    if (modalLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    // Função para determinar o status do prazo e as classes de estilo
    const getPrazoStatus = (pad: ProcessoDisciplinar) => {
      if (pad.respostaRecebida) {
        return { status: 'respondido', borderClass: 'border-green-300', bgClass: 'bg-green-50' };
      }

      if (!pad.prazoDefesa) {
        return { status: 'normal', borderClass: 'border-gray-200', bgClass: 'hover:bg-gray-50' };
      }

      const hoje = startOfDay(new Date());
      const prazo = startOfDay(pad.prazoDefesa);
      const diasRestantes = differenceInDays(prazo, hoje);

      if (pad.prazoVencido || isBefore(prazo, hoje)) {
        return { status: 'vencido', borderClass: 'border-red-400', bgClass: 'bg-red-50', diasRestantes };
      }

      if (diasRestantes <= 5) {
        return { status: 'proximo', borderClass: 'border-orange-400', bgClass: 'bg-orange-50', diasRestantes };
      }

      return { status: 'normal', borderClass: 'border-gray-200', bgClass: 'hover:bg-gray-50', diasRestantes };
    };

    switch (selectedModal) {
      case 'padsFinalizados':
        return modalData.pads.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum PAD encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {modalData.pads.map((pad) => (
              <div key={pad.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{pad.numero || `PAD-${pad.id?.slice(0, 6)}`}</span>
                      <Badge variant="default">
                        {pad.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{pad.militarPosto} {pad.militarNome}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {pad.dataAbertura && format(pad.dataAbertura, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Link href={`/processos`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        );

      case 'padsEmAndamento':
        return modalData.pads.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum PAD encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {modalData.pads.map((pad) => {
              const prazoStatus = getPrazoStatus(pad);
              return (
                <div
                  key={pad.id}
                  className={`p-4 border-2 rounded-lg transition-colors ${prazoStatus.borderClass} ${prazoStatus.bgClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{pad.numero || `PAD-${pad.id?.slice(0, 6)}`}</span>
                        <Badge variant="secondary">
                          {pad.status}
                        </Badge>
                        {prazoStatus.status === 'vencido' && (
                          <Badge variant="destructive" className="text-xs">
                            PRAZO VENCIDO
                          </Badge>
                        )}
                        {prazoStatus.status === 'proximo' && prazoStatus.diasRestantes !== undefined && (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">
                            {prazoStatus.diasRestantes === 0 ? 'VENCE HOJE' : `${prazoStatus.diasRestantes} dia${prazoStatus.diasRestantes > 1 ? 's' : ''} restante${prazoStatus.diasRestantes > 1 ? 's' : ''}`}
                          </Badge>
                        )}
                        {prazoStatus.status === 'respondido' && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                            RESPONDIDO
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{pad.militarPosto} {pad.militarNome}</p>
                      {pad.prazoDefesa && (
                        <p className={`text-xs mt-1 ${prazoStatus.status === 'vencido' ? 'text-red-600 font-medium' : prazoStatus.status === 'proximo' ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                          Prazo de defesa: {format(pad.prazoDefesa, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {pad.dataAbertura && `Abertura: ${format(pad.dataAbertura, "dd/MM/yyyy", { locale: ptBR })}`}
                      </p>
                    </div>
                    <Link href={`/processos`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'sindicanciasFinalizadas':
      case 'sindicanciasEmAndamento':
        return modalData.sindicancias.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhuma sindicância encontrada
          </div>
        ) : (
          <div className="space-y-3">
            {modalData.sindicancias.map((sind) => (
              <div key={sind.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium">{sind.numero}</span>
                      <Badge variant={sind.status === 'Concluída' ? 'default' : 'secondary'}>
                        {sind.status}
                      </Badge>
                      {sind.prorrogacoes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {sind.prorrogacoes} prorrog.
                        </Badge>
                      )}
                    </div>
                    {sind.militarInvestigadoNome && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Investigado:</span> {sind.militarInvestigadoNome}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Encarregado:</span> {sind.encarregadoPosto} {sind.encarregadoNome}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Prazo inicial: {sind.prazoInicial} dias
                    </p>
                  </div>
                  <Link href={`/sindicancias`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        );

      case 'militares':
        return modalData.militares.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum militar encontrado
          </div>
        ) : (
          <div className="space-y-2">
            {modalData.militares.map((militar) => (
              <div key={militar.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {militar.nome?.charAt(0) || 'M'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{militar.patente || militar.postoGraduacao} {militar.nome}</p>
                    <p className="text-xs text-gray-500">{militar.unidade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {militar.comportamento && (
                    <Badge variant="outline" className="text-xs">
                      {militar.comportamento}
                    </Badge>
                  )}
                  <Link href={`/militares`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        );

      case 'reincidentes':
        return modalData.reincidentes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhum militar reincidente encontrado
          </div>
        ) : (
          <div className="space-y-2">
            {modalData.reincidentes.map((item) => (
              <div key={item.militar.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.militar.patente} {item.militar.nome}</p>
                    <p className="text-xs text-gray-500">{item.totalTransgressoes} transgressões</p>
                  </div>
                </div>
                <Badge variant="destructive">{item.totalTransgressoes}x</Badge>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Selecione um card para ver detalhes
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral do sistema de gestão disciplinar
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsConfig.map((stat) => (
          <StatsCard
            key={stat.modalKey}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
            loading={loading}
            onClick={() => setSelectedModal(stat.modalKey)}
          />
        ))}
      </div>

      {/* Timeline e Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Timeline />
        <ComportamentoChart />
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedModal} onOpenChange={() => setSelectedModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedModal && statsConfig.find(s => s.modalKey === selectedModal)?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="p-4">
              {renderModalContent()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
