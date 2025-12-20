'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ComportamentoMilitar } from '@/types';
import { motion } from 'framer-motion';

interface ComportamentoData {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

const comportamentoConfig: Record<string, { color: string; bgColor: string; order: number }> = {
  [ComportamentoMilitar.EXCEPCIONAL]: { color: 'bg-emerald-500', bgColor: 'bg-emerald-100', order: 1 },
  [ComportamentoMilitar.OTIMO]: { color: 'bg-green-500', bgColor: 'bg-green-100', order: 2 },
  [ComportamentoMilitar.BOM]: { color: 'bg-blue-500', bgColor: 'bg-blue-100', order: 3 },
  [ComportamentoMilitar.INSUFICIENTE]: { color: 'bg-yellow-500', bgColor: 'bg-yellow-100', order: 4 },
  [ComportamentoMilitar.MAU]: { color: 'bg-red-500', bgColor: 'bg-red-100', order: 5 },
};

export function ComportamentoChart() {
  const [data, setData] = useState<ComportamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'militares'));
        const contagem: Record<string, number> = {
          [ComportamentoMilitar.EXCEPCIONAL]: 0,
          [ComportamentoMilitar.OTIMO]: 0,
          [ComportamentoMilitar.BOM]: 0,
          [ComportamentoMilitar.INSUFICIENTE]: 0,
          [ComportamentoMilitar.MAU]: 0,
        };

        let totalMilitares = 0;

        snapshot.docs.forEach(doc => {
          const militar = doc.data();
          const comportamento = militar.comportamento || ComportamentoMilitar.BOM;
          if (contagem[comportamento] !== undefined) {
            contagem[comportamento]++;
          } else {
            // Se o comportamento não está no enum, conta como BOM
            contagem[ComportamentoMilitar.BOM]++;
          }
          totalMilitares++;
        });

        const chartData: ComportamentoData[] = Object.entries(contagem)
          .map(([label, count]) => ({
            label,
            count,
            color: comportamentoConfig[label]?.color || 'bg-gray-500',
            bgColor: comportamentoConfig[label]?.bgColor || 'bg-gray-100',
          }))
          .sort((a, b) => {
            const orderA = comportamentoConfig[a.label]?.order || 99;
            const orderB = comportamentoConfig[b.label]?.order || 99;
            return orderA - orderB;
          });

        setData(chartData);
        setTotal(totalMilitares);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados de comportamento:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Distribuição de Comportamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Nenhum militar cadastrado
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-500">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={`h-8 rounded-lg ${item.bgColor} overflow-hidden`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                      className={`h-full ${item.color} rounded-lg flex items-center justify-end pr-2`}
                    >
                      {barWidth > 15 && (
                        <span className="text-white text-xs font-medium">
                          {item.count}
                        </span>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}

            {/* Resumo */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">Total de Militares</span>
                <span className="font-bold text-lg">{total}</span>
              </div>
            </div>

            {/* Legenda de cores */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
