'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import {
  FileText,
  Search,
  AlertTriangle,
  Users,
  TrendingUp,
  FileCheck,
  SearchCheck
} from 'lucide-react';

// Lazy load componentes pesados
const Timeline = dynamic(() => import('@/components/dashboard/timeline').then(mod => ({ default: mod.Timeline })), {
  loading: () => <div className="bg-white rounded-lg shadow p-6 h-[400px] animate-pulse" />,
  ssr: false
});

const Dialog = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.Dialog })));
const DialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogContent })));
const DialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogHeader })));
const DialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => ({ default: mod.DialogTitle })));
const ScrollArea = dynamic(() => import('@/components/ui/scroll-area').then(mod => ({ default: mod.ScrollArea })));

export default function Home() {
  const { stats, loading } = useRealtimeStats();
  const [selectedModal, setSelectedModal] = useState<string | null>(null);

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

        {/* Placeholder para gráfico de comportamento */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribuição de Comportamento
          </h3>
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Gráfico de distribuição de comportamento
          </div>
        </div>
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
              {/* Conteúdo do modal seria carregado dinamicamente */}
              <div className="text-center text-gray-500 py-8">
                Lista detalhada será exibida aqui
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
