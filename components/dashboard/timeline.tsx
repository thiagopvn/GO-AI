'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/config';
import { Transgressao, Militar } from '@/types';

interface TimelineItem {
  id: string;
  data: Date;
  militar: string;
  descricao: string;
  reincidente: boolean;
  tipoPunicao: string;
}

export function Timeline() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query para buscar as últimas transgressões
    const q = query(
      collection(firestore, 'transgressoes'),
      orderBy('data', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transgressoes: TimelineItem[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // Buscar dados do militar
        // Em produção, seria melhor fazer isso com uma subcoleção ou dados denormalizados
        transgressoes.push({
          id: doc.id,
          data: data.data.toDate(),
          militar: data.militarNome || 'Militar não identificado',
          descricao: data.descricao,
          reincidente: data.reincidente,
          tipoPunicao: data.tipoPunicao
        });
      }

      setItems(transgressoes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariant = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Linha do Tempo de Transgressões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              Nenhuma transgressão registrada
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariant}
                  className="border-l-4 border-slate-200 pl-4 pb-4 last:pb-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{item.militar}</span>
                        {item.reincidente && (
                          <Badge variant="destructive" className="text-xs">
                            REINCIDENTE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        {item.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(item.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.tipoPunicao}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}