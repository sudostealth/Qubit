'use client'

import { useEffect } from 'react'

export default function CleanupTrigger() {
  useEffect(() => {
    // Call cleanup endpoint on mount
    fetch('/api/cleanup', { method: 'POST' }).catch(console.error)
  }, [])

  return null
}
