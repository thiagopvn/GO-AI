'use client';

import { useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Timeline } from '@/components/dashboard/timeline';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Visão geral do sistema de gestão disciplinar
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {statsConfig.map((stat, index) => (
          <motion.div
            key={stat.modalKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <StatsCard
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              color={stat.color}
              loading={loading}
              onClick={() => setSelectedModal(stat.modalKey)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Timeline e Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid gap-8 lg:grid-cols-2"
      >
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
      </motion.div>

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
