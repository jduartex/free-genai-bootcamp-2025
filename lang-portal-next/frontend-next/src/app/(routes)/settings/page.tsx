'use client'

import { useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { fetchData } from '@/services/api'
import { Button } from '@/components/ui/button'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              className="bg-card border border-input rounded-md px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Reset Study History */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Reset Study History</h2>
          <p className="text-muted-foreground">
            This will permanently delete all your study session history. This action cannot be undone.
          </p>
          {!showResetDialog ? (
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
            >
              Reset Study History
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-yellow-800">
                  To confirm, type "reset me" in the box below:
                </p>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded px-3 py-1"
                  placeholder="Type 'reset me' to confirm"
                />
                {error && (
                  <p className="mt-2 text-red-500">{error}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleReset}
                  disabled={resetConfirmation.toLowerCase() !== 'reset me' || isResetting}
                  variant="destructive"
                >
                  {isResetting ? 'Resetting...' : 'Confirm Reset'}
                </Button>
                <Button
                  onClick={() => {
                    setShowResetDialog(false)
                    setResetConfirmation('')
                    setError(null)
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}