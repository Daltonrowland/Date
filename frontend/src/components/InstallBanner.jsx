import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem('pwa_dismissed')) return

    const handler = () => setShow(true)
    window.addEventListener('pwa-install-available', handler)

    // Check if prompt is already stored
    if (window.__pwaInstallPrompt) setShow(true)

    return () => window.removeEventListener('pwa-install-available', handler)
  }, [])

  if (!show || dismissed) return null

  const handleInstall = async () => {
    const prompt = window.__pwaInstallPrompt
    if (!prompt) return
    prompt.prompt()
    const result = await prompt.userChoice
    if (result.outcome === 'accepted') {
      setShow(false)
      window.__pwaInstallPrompt = null
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa_dismissed', '1')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 bg-dark-900/95 backdrop-blur-md border-t border-purple-500/20 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          RS
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">Add to Home Screen</p>
          <p className="text-white/40 text-xs">Install Relationship Scores for the best experience</p>
        </div>
        <button onClick={handleInstall} style={{ cursor: 'pointer' }}
          className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold flex-shrink-0">
          Install
        </button>
        <button onClick={handleDismiss} style={{ cursor: 'pointer' }}
          className="text-white/30 hover:text-white/60 text-lg flex-shrink-0 w-8 h-8 flex items-center justify-center">
          ✕
        </button>
      </div>
    </div>
  )
}
