'use client'

import { useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { fetchData } from '@/services/api'
import { Button } from '@/components/ui/button'

/**
 * Renders the settings interface for managing the application's theme and study history.
 *
 * This component offers a dropdown for selecting a theme ("light", "dark", or "system")
 * and a section to reset study history. To initiate a reset, the user must type "reset me"
 * into a confirmation input. If the confirmation matches, a POST request is sent to clear
 * study sessions; on success, the reset dialog is dismissed and the user is alerted, while
 * errors during the reset process are displayed.
 *
 * @returns The settings UI component.
 */
export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark' || value === 'system') {
      setTheme(value)
    }
  }

  const handleReset = async () => {
    if (resetConfirmation.toLowerCase() !== 'reset me') {
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      await fetchData('/study-sessions/reset', 'POST')
      setShowResetDialog(false)
      setResetConfirmation('')
      alert('Study history has been cleared successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset history')
      console.error('Error resetting history:', err)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="bg-card shadow rounded-lg p-6 space-y-6">
        {/* Theme Settings */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Theme</h2>
          <div className="flex items-center space-x-4">
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-32 bg-background text-foreground border border-input rounded-md px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-primary"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <span className="text-sm text-muted-foreground">
              {theme === 'system' ? 'Using system theme' : `Using ${theme} theme`}
            </span>
          </div>
        </div>

        {/* Reset History */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Reset Study History</h2>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all your study session history. This action cannot be undone.
          </p>
          {!showResetDialog ? (
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
            >
              Reset History
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Type "reset me" to confirm:</p>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded-md bg-background text-foreground"
                  placeholder="reset me"
                />
              </div>
              <div className="space-x-2">
                <Button
                  onClick={handleReset}
                  variant="destructive"
                  disabled={resetConfirmation.toLowerCase() !== 'reset me' || isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </Button>
                <Button
                  onClick={() => {
                    setShowResetDialog(false)
                    setResetConfirmation('')
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}