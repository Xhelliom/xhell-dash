/**
 * Composant PlexRecentImages
 * 
 * Affiche les 3 dernières images des médias ajoutés dans Plex
 */

'use client'

import { useState, useEffect } from 'react'
import type { PlexRecentMedia } from '@/lib/types'

interface PlexRecentImagesProps {
  appId: string
}

/**
 * Composant qui affiche les 3 dernières images des médias ajoutés dans Plex
 */
export function PlexRecentImages({ appId }: PlexRecentImagesProps) {
  const [recentMedia, setRecentMedia] = useState<PlexRecentMedia[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchRecentMedia = async () => {
      setIsLoading(true)
      try {
        // Récupérer les stats Plex
        const response = await fetch(`/api/apps/${appId}/stats/plex`)
        if (response.ok) {
          const data = await response.json()
          // Prendre les 3 premiers médias avec des images
          const mediaWithThumbs = (data.recentMedia || [])
            .filter((media: PlexRecentMedia) => media.thumb)
            .slice(0, 3)
          setRecentMedia(mediaWithThumbs)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des médias récents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentMedia()

    // Rafraîchir toutes les 10 minutes (600000 ms) pour éviter les artefacts visuels
    const interval = setInterval(fetchRecentMedia, 600000)
    return () => clearInterval(interval)
  }, [appId])

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-12 animate-pulse rounded-[2px] bg-muted"
          />
        ))}
      </div>
    )
  }

  if (recentMedia.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2">
      {recentMedia.map((media, index) => (
        <div
          key={`${media.ratingKey}-${index}`}
          className="relative h-16 w-12 overflow-hidden rounded-[2px] border"
        >
          <img
            src={media.thumb}
            alt={media.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Cacher l'image en cas d'erreur
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      ))}
    </div>
  )
}

