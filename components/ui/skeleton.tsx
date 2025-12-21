/**
 * Composant Skeleton pour les animations de chargement
 * 
 * Fournit des composants skeleton pour afficher des placeholders
 * pendant le chargement des données
 */

import { cn } from '@/lib/utils'

/**
 * Composant Skeleton de base
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

/**
 * Skeleton pour une carte KPI
 */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
    </div>
  )
}

/**
 * Skeleton pour une liste d'éléments
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
          <Skeleton className="w-16 h-24 rounded-sm" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton pour un graphique
 */
export function SkeletonChart() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-24 w-full rounded" />
    </div>
  )
}

/**
 * Skeleton pour un nombre de statistique
 */
export function SkeletonStat() {
  return (
    <div className="flex items-baseline gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export { Skeleton }
