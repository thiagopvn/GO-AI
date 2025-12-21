"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { getStatusPrazo, StatusPrazo } from "@/lib/utils/dias-uteis"
import { cn } from "@/lib/utils"

interface PrazoBadgeProps {
  prazoDefesa?: Date
  respostaRecebida?: boolean
  className?: string
}

export function PrazoBadge({ prazoDefesa, respostaRecebida, className }: PrazoBadgeProps) {
  // Se já recebeu resposta, mostra badge de sucesso
  if (respostaRecebida) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-green-50 text-green-700 border-green-200 flex items-center gap-1",
          className
        )}
      >
        <CheckCircle className="h-3 w-3" />
        Resposta recebida
      </Badge>
    )
  }

  // Se não há prazo definido, não mostra nada
  if (!prazoDefesa) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        Aguardando recebimento
      </Badge>
    )
  }

  const status = getStatusPrazo(prazoDefesa)

  const getVariantStyles = (cor: StatusPrazo['cor']) => {
    switch (cor) {
      case 'green':
        return "bg-green-50 text-green-700 border-green-200"
      case 'yellow':
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case 'orange':
        return "bg-orange-50 text-orange-700 border-orange-200"
      case 'red':
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const Icon = status.vencido ? AlertTriangle : Clock

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1",
        getVariantStyles(status.cor),
        status.vencido && "animate-pulse",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {status.texto}
    </Badge>
  )
}
