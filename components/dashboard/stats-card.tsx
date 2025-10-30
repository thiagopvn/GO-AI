'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
  loading?: boolean;
}

const colorVariants = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500'
};

const bgVariants = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  yellow: 'bg-yellow-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50'
};

const textVariants = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  red: 'text-red-600',
  purple: 'text-purple-600'
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  onClick,
  loading = false
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg',
          onClick && 'hover:ring-2 hover:ring-offset-2',
          onClick && `hover:ring-${color}-500`
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn('p-2 rounded-lg', bgVariants[color])}>
            <Icon className={cn('h-4 w-4', textVariants[color])} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
            ) : (
              <motion.span
                key={value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {value?.toLocaleString('pt-BR') || 0}
              </motion.span>
            )}
          </div>
          {description && (
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}