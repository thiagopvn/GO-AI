import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DashboardStats, StatusProcesso, TipoProcesso } from '@/types';

export function useRealtimeStats() {
  const [stats, setStats] = useState<DashboardStats>({
    padsFinalizados: 0,
    padsEmAndamento: 0,
    sindicanciasFinalizadas: 0,
    sindicanciasEmAndamento: 0,
    ipmsRegistrados: 0,
    totalMilitares: 0,
    totalReincidentes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para buscar contagens do Firestore
    const fetchStats = async () => {
      try {
        // Buscar PADs em andamento (da coleção 'processos' com tipo PAD)
        const padsEmAndamentoQuery = query(
          collection(db, 'processos'),
          where('tipo', '==', TipoProcesso.PAD),
          where('status', '==', StatusProcesso.EM_ANDAMENTO)
        );
        const padsEmAndamentoSnap = await getCountFromServer(padsEmAndamentoQuery);

        // Buscar PADs finalizados
        const padsFinalizadosQuery = query(
          collection(db, 'processos'),
          where('tipo', '==', TipoProcesso.PAD),
          where('status', '==', StatusProcesso.FINALIZADO)
        );
        const padsFinalizadosSnap = await getCountFromServer(padsFinalizadosQuery);

        // Buscar sindicâncias em andamento
        const sindicEmAndamentoQuery = query(
          collection(db, 'sindicancias'),
          where('status', '==', 'Em Andamento')
        );
        const sindicEmAndamentoSnap = await getCountFromServer(sindicEmAndamentoQuery);

        // Buscar sindicâncias finalizadas
        const sindicFinalizadasQuery = query(
          collection(db, 'sindicancias'),
          where('status', '==', 'Concluída')
        );
        const sindicFinalizadasSnap = await getCountFromServer(sindicFinalizadasQuery);

        // Buscar total de militares
        const militaresSnap = await getCountFromServer(collection(db, 'militares'));

        // Buscar militares reincidentes (que têm mais de 1 transgressão)
        // Primeiro, buscar todas as transgressões e contar por militar
        const transgressoesSnap = await getCountFromServer(collection(db, 'transgressoes'));

        setStats({
          padsEmAndamento: padsEmAndamentoSnap.data().count,
          padsFinalizados: padsFinalizadosSnap.data().count,
          sindicanciasEmAndamento: sindicEmAndamentoSnap.data().count,
          sindicanciasFinalizadas: sindicFinalizadasSnap.data().count,
          ipmsRegistrados: 0,
          totalMilitares: militaresSnap.data().count,
          totalReincidentes: Math.floor(transgressoesSnap.data().count / 2) // Aproximação
        });

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setLoading(false);
      }
    };

    // Buscar estatísticas iniciais
    fetchStats();

    // Configurar listeners para atualizações em tempo real
    const unsubscribers: (() => void)[] = [];

    // Listener para processos (PADs)
    const processosQuery = query(
      collection(db, 'processos'),
      where('tipo', '==', TipoProcesso.PAD)
    );

    const unsubProcessos = onSnapshot(processosQuery, (snapshot) => {
      let emAndamento = 0;
      let finalizados = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === StatusProcesso.EM_ANDAMENTO) {
          emAndamento++;
        } else if (data.status === StatusProcesso.FINALIZADO) {
          finalizados++;
        }
      });

      setStats(prev => ({
        ...prev,
        padsEmAndamento: emAndamento,
        padsFinalizados: finalizados
      }));
    });
    unsubscribers.push(unsubProcessos);

    // Listener para sindicâncias
    const unsubSindicancias = onSnapshot(collection(db, 'sindicancias'), (snapshot) => {
      let emAndamento = 0;
      let finalizadas = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Em Andamento') {
          emAndamento++;
        } else if (data.status === 'Concluída') {
          finalizadas++;
        }
      });

      setStats(prev => ({
        ...prev,
        sindicanciasEmAndamento: emAndamento,
        sindicanciasFinalizadas: finalizadas
      }));
    });
    unsubscribers.push(unsubSindicancias);

    // Listener para militares
    const unsubMilitares = onSnapshot(collection(db, 'militares'), (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalMilitares: snapshot.size
      }));
    });
    unsubscribers.push(unsubMilitares);

    // Listener para transgressões (reincidentes)
    const unsubTransgressoes = onSnapshot(collection(db, 'transgressoes'), (snapshot) => {
      // Contar militares únicos com múltiplas transgressões
      const transgressoesPorMilitar: Record<string, number> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.militarId) {
          transgressoesPorMilitar[data.militarId] = (transgressoesPorMilitar[data.militarId] || 0) + 1;
        }
      });

      // Contar quantos militares têm mais de 1 transgressão
      const reincidentes = Object.values(transgressoesPorMilitar).filter(count => count > 1).length;

      setStats(prev => ({
        ...prev,
        totalReincidentes: reincidentes
      }));
    });
    unsubscribers.push(unsubTransgressoes);

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return { stats, loading };
}
