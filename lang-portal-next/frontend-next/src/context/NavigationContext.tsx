'use client'

import React, { createContext, useContext, useState } from 'react'
import type { GroupDetails, Word, StudyActivity } from '@/services/api'

interface NavigationContextType {
  currentGroup: GroupDetails | null
  setCurrentGroup: (group: GroupDetails | null) => void
  currentWord: Word | null
  setCurrentWord: (word: Word | null) => void
  currentStudyActivity: StudyActivity | null
  setCurrentStudyActivity: (activity: StudyActivity | null) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

/**
 * Provides navigation state context to descendant components.
 *
 * This component maintains state for the current group, word, and study activity,
 * and exposes these state values along with their setter functions through the NavigationContext.
 * It should wrap components that need to access or update navigation-related state.
 *
 * @param children - The React elements that will have access to the navigation context.
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentGroup, setCurrentGroup] = useState<GroupDetails | null>(null)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [currentStudyActivity, setCurrentStudyActivity] = useState<StudyActivity | null>(null)

  return (
    <NavigationContext.Provider
      value={{
        currentGroup,
        setCurrentGroup,
        currentWord,
        setCurrentWord,
        currentStudyActivity,
        setCurrentStudyActivity
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

/**
 * Returns the current navigation context.
 *
 * This hook provides access to the navigation state and updater functions for the current group, word, and study activity.
 * It throws an error if called outside of a NavigationProvider.
 *
 * @throws {Error} When the navigation context is accessed outside a NavigationProvider.
 */
export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
