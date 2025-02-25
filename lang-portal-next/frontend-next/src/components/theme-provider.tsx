'use client'

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { fetchTheme, updateTheme } from "@/services/api"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

/**
 * Determines the system's preferred color scheme.
 *
 * In a browser, it returns "dark" if the system prefers dark mode based on the 
 * "(prefers-color-scheme: dark)" media query; otherwise, it returns "light". When executed 
 * in a non-browser environment, the function defaults to "light".
 *
 * @returns "dark" if the system prefers dark mode, otherwise "light".
 */
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/**
 * Provides a context for managing the application's theme.
 *
 * This component initializes the theme state by fetching the current theme from an API and applies
 * the theme as a class on the document's root element. When the theme is set to "system", it listens for
 * changes in the system's preferred color scheme and updates accordingly. The provider delays context establishment
 * until after mounting to ensure accurate theme detection.
 *
 * @param defaultTheme - Optional initial theme; defaults to "system".
 *
 * @returns The ThemeProvider context wrapping its children, or the children directly if the component has not mounted.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  // Initial theme fetch
  useEffect(() => {
    fetchTheme()
      .then(response => {
        if (response.theme) {
          setThemeState(response.theme as Theme)
        }
      })
      .catch(error => {
        console.error('Failed to fetch theme:', error)
      })
  }, [])

  // Theme change handler
  const setTheme = async (newTheme: Theme) => {
    try {
      const response = await updateTheme(newTheme)
      if (response.theme) {
        setThemeState(response.theme as Theme)
      }
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = getSystemTheme()
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(getSystemTheme())
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProviderContext.Provider 
      value={{
        theme,
        setTheme,
      }}
      {...props}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
