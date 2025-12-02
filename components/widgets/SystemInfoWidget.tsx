/**
 * Widget SystemInfo - Informations système
 * 
 * Affiche des informations système comme l'uptime, la date de dernière mise à jour, etc.
 */

'use client'

import { useState, useEffect } from 'react'
import { SystemInfoWidgetConfig } from '@/lib/types'
import { Server } from 'lucide-react'

interface SystemInfoWidgetProps {
    config?: SystemInfoWidgetConfig
}

export function SystemInfoWidget({ config }: SystemInfoWidgetProps) {
    const [uptime, setUptime] = useState<string>('')
    const showUptime = config?.showUptime !== false
    const showLastUpdate = config?.showLastUpdate !== false
    const customInfo = config?.customInfo || []

    useEffect(() => {
        if (showUptime) {
            // Calculer l'uptime depuis le chargement de la page
            const startTime = Date.now()
            const updateUptime = () => {
                const elapsed = Date.now() - startTime
                const seconds = Math.floor(elapsed / 1000)
                const minutes = Math.floor(seconds / 60)
                const hours = Math.floor(minutes / 60)
                const days = Math.floor(hours / 24)

                if (days > 0) {
                    setUptime(`${days}j ${hours % 24}h`)
                } else if (hours > 0) {
                    setUptime(`${hours}h ${minutes % 60}m`)
                } else if (minutes > 0) {
                    setUptime(`${minutes}m ${seconds % 60}s`)
                } else {
                    setUptime(`${seconds}s`)
                }
            }

            updateUptime()
            const interval = setInterval(updateUptime, 1000)

            return () => clearInterval(interval)
        }
    }, [showUptime])

    return (
        <div className="flex flex-col items-center justify-center min-h-[150px] w-full">
            <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Système</h3>
            </div>

            <div className="space-y-2 text-sm w-full">
                {showUptime && (
                    <div className="flex justify-center gap-2">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="font-medium">{uptime}</span>
                    </div>
                )}

                {showLastUpdate && (
                    <div className="flex justify-center gap-2">
                        <span className="text-muted-foreground">Dernière MAJ:</span>
                        <span className="font-medium">
                            {new Date().toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                )}

                {customInfo.map((info, index) => (
                    <div key={index} className="flex justify-center gap-2">
                        <span className="text-muted-foreground">{info.label}:</span>
                        <span className="font-medium">{info.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

