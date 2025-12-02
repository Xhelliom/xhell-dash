/**
 * Sidebar de navigation pour la configuration
 * 
 * Affiche un menu de navigation pour accéder aux différentes sections :
 * - Paramètres de base
 * - Affichage de la carte
 * - Statistiques
 */

'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Settings, Layout, BarChart3 } from 'lucide-react'

/**
 * Sections de configuration disponibles
 */
const CONFIG_SECTIONS = [
  {
    id: 'basic',
    label: 'Paramètres de base',
    icon: Settings,
    description: 'Nom, URL, logo',
  },
  {
    id: 'display',
    label: 'Affichage de la carte',
    icon: Layout,
    description: 'Statistique sur la carte',
  },
  {
    id: 'stats',
    label: 'Statistiques',
    icon: BarChart3,
    description: 'Template et options',
  },
] as const

function ConfigSidebarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = searchParams.get('section') || 'basic'

  /**
   * Construit l'URL avec la section sélectionnée
   */
  const buildUrl = (sectionId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', sectionId)
    return `${pathname}?${params.toString()}`
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CONFIG_SECTIONS.map((item) => {
                const Icon = item.icon
                const isActive = section === item.id

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.description}
                    >
                      <a href={buildUrl(item.id)}>
                        <Icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function ConfigSidebar() {
  return (
    <Suspense fallback={
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Configuration</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-4 text-sm text-muted-foreground">
                Chargement...
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    }>
      <ConfigSidebarContent />
    </Suspense>
  )
}

