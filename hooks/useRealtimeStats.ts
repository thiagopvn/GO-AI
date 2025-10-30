import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDB } from '@/lib/firebase/config';
import { DashboardStats } from '@/types';

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
    // Referência para os stats no Realtime Database
    const statsRef = ref(realtimeDB, 'dashboard/stats');

    // Listener para atualizações em tempo real
    const unsubscribe = onValue(
      statsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setStats(snapshot.val());
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar estatísticas:', error);
        setLoading(false);
      }
    );

    // Cleanup
    return () => unsubscribe();
  }, []);

  return { stats, loading };
}