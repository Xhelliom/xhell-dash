/**
 * Layout pour la page de configuration
 * 
 * Fournit un layout avec sidebar pour naviguer entre les différentes sections
 * de configuration d'une application
 */

'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ConfigSidebar } from '@/components/config/ConfigSidebar'

export default function ConfigLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ConfigSidebar />
      <SidebarInset className="flex flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

