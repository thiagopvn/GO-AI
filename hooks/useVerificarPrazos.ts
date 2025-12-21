'use client';

import { useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProcessoDisciplinar, StatusProcesso, TipoProcesso } from '@/types';
import { isPrazoVencido, diasUteisRestantes } from '@/lib/utils/dias-uteis';
import { notificacaoService } from '@/lib/services/NotificacaoService';

export function useVerificarPrazos() {
  const verificarPrazosVencidos = useCallback(async () => {
    try {
      // Buscar todos os PADs em andamento que têm prazo de defesa definido
      const q = query(
        collection(db, 'processos'),
        where('tipo', '==', TipoProcesso.PAD),
        where('status', '==', StatusProcesso.EM_ANDAMENTO)
      );

      const snapshot = await getDocs(q);
      const processos = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        dataAbertura: docSnap.data().dataAbertura?.toDate() || new Date(),
        prazoDefesa: docSnap.data().prazoDefesa?.toDate(),
        dataRecebimentoPAD: docSnap.data().dataRecebimentoPAD?.toDate(),
      })) as ProcessoDisciplinar[];

      for (const processo of processos) {
        // Pular se não tem prazo definido ou já recebeu resposta
        if (!processo.prazoDefesa || processo.respostaRecebida) {
          continue;
        }

        const prazoVencido = isPrazoVencido(processo.prazoDefesa);
        const diasRestantes = diasUteisRestantes(processo.prazoDefesa);

        // Se o prazo venceu e ainda não foi notificado
        if (prazoVencido && !processo.notificacaoPrazoEnviada) {
          // Criar notificação de prazo vencido
          await notificacaoService.criarNotificacaoPrazoVencido(
            processo.numero,
            processo.militarNome || 'Militar',
            processo.id
          );

          // Marcar como prazo vencido e notificação enviada
          await updateDoc(doc(db, 'processos', processo.id), {
            prazoVencido: true,
            notificacaoPrazoEnviada: true
          });

          console.log(`Notificação de prazo vencido criada para PAD ${processo.numero}`);
        }

        // Se o prazo está próximo do vencimento (2 dias ou menos)
        if (!prazoVencido && diasRestantes <= 2 && diasRestantes >= 0) {
          // Verificar se já não foi notificado recentemente sobre prazo próximo
          // (Esta é uma simplificação - em produção seria necessário um controle mais sofisticado)
          await notificacaoService.criarNotificacaoPrazoProximo(
            processo.numero,
            processo.militarNome || 'Militar',
            diasRestantes,
            processo.id
          );

          console.log(`Notificação de prazo próximo criada para PAD ${processo.numero}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar prazos:', error);
    }
  }, []);

  // Verificar prazos ao montar o componente e a cada 5 minutos
  useEffect(() => {
    // Verificar imediatamente
    verificarPrazosVencidos();

    // Verificar a cada 5 minutos
    const intervalo = setInterval(verificarPrazosVencidos, 5 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [verificarPrazosVencidos]);

  return { verificarPrazosVencidos };
}
