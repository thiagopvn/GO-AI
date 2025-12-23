'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Eye, X } from 'lucide-react';
import { ComportamentoMilitar } from '@/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ComportamentoChangeIndicatorProps {
  comportamentoAnterior?: ComportamentoMilitar;
  comportamentoAtual?: ComportamentoMilitar;
  tipoMudanca?: 'melhoria' | 'queda';
  dataMudanca?: Date;
  onMarcarVisto?: () => void;
  className?: string;
  showInCard?: boolean; // Para exibição compacta no card
}

export function ComportamentoChangeIndicator({
  comportamentoAnterior,
  comportamentoAtual,
  tipoMudanca,
  dataMudanca,
  onMarcarVisto,
  className,
  showInCard = true
}: ComportamentoChangeIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isMelhoria = tipoMudanca === 'melhoria';

  // Cores e estilos baseados no tipo de mudança
  const baseClasses = cn(
    'relative inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-all duration-200',
    isMelhoria
      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200'
      : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-200',
    'shadow-lg',
    className
  );

  // Animação de pulse
  const pulseClasses = cn(
    'absolute inset-0 rounded-full animate-ping opacity-40',
    isMelhoria ? 'bg-emerald-400' : 'bg-red-400'
  );

  // Ícone de seta
  const ArrowIcon = isMelhoria ? ArrowUp : ArrowDown;

  // Formatar data
  const dataFormatada = dataMudanca
    ? format(dataMudanca, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Data não informada';

  // Versão compacta para o card
  if (showInCard) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(baseClasses, 'cursor-pointer')}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Efeito de pulse */}
              <span className={pulseClasses} />

              {/* Conteúdo */}
              <span className="relative flex items-center gap-1">
                <ArrowIcon className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {isMelhoria ? 'Melhorou' : 'Piorou'}
                </span>
              </span>

              {/* Botão de fechar (marcar como visto) */}
              {isHovered && onMarcarVisto && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarcarVisto();
                  }}
                  className="relative ml-1 rounded-full bg-white/20 p-0.5 hover:bg-white/40 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className={cn(
              'max-w-xs p-3',
              isMelhoria ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowIcon className={cn('h-4 w-4', isMelhoria ? 'text-emerald-600' : 'text-red-600')} />
                <span className={cn('font-semibold', isMelhoria ? 'text-emerald-800' : 'text-red-800')}>
                  {isMelhoria ? 'Comportamento Melhorou!' : 'Comportamento Piorou'}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <p>
                  <span className="font-medium">De:</span>{' '}
                  <span className="text-gray-500">{comportamentoAnterior}</span>
                </p>
                <p>
                  <span className="font-medium">Para:</span>{' '}
                  <span className={isMelhoria ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {comportamentoAtual}
                  </span>
                </p>
              </div>
              <p className="text-xs text-gray-500">{dataFormatada}</p>
              {onMarcarVisto && (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    'w-full mt-2 text-xs',
                    isMelhoria
                      ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      : 'border-red-300 text-red-700 hover:bg-red-100'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarcarVisto();
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Marcar como visto
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Versão expandida (para detalhes ou modal)
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-3 border',
        isMelhoria
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200',
        className
      )}
    >
      {/* Ícone com animação */}
      <div className="relative">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full',
            isMelhoria ? 'bg-emerald-500' : 'bg-red-500'
          )}
        >
          <ArrowIcon className="h-5 w-5 text-white" />
        </div>
        <span className={cn(pulseClasses, 'w-10 h-10')} />
      </div>

      {/* Informações */}
      <div className="flex-1">
        <p className={cn('font-semibold', isMelhoria ? 'text-emerald-800' : 'text-red-800')}>
          {isMelhoria ? 'Comportamento Melhorou!' : 'Comportamento Piorou'}
        </p>
        <p className="text-sm text-gray-600">
          {comportamentoAnterior} <span className="mx-1">→</span>{' '}
          <span className={isMelhoria ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
            {comportamentoAtual}
          </span>
        </p>
        <p className="text-xs text-gray-500 mt-1">{dataFormatada}</p>
      </div>

      {/* Botão de marcar como visto */}
      {onMarcarVisto && (
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            isMelhoria
              ? 'text-emerald-700 hover:bg-emerald-100'
              : 'text-red-700 hover:bg-red-100'
          )}
          onClick={onMarcarVisto}
        >
          <Eye className="h-4 w-4 mr-1" />
          Visto
        </Button>
      )}
    </div>
  );
}
