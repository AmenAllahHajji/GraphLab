import {
  MantineProvider,
  createTheme,
  type MantineColorsTuple,
} from '@mantine/core'
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

type ColorScheme = 'light' | 'dark'

interface AppThemeContextValue {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null)

const elementaryBlue: MantineColorsTuple = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#38bdf8',
  '#0ea5e9',
  '#0284c7',
  '#0369a1',
  '#075985',
  '#0c4a6e',
]

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: elementaryBlue,
  },
  fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
})

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const persisted = window.localStorage.getItem('graph-lab-color-scheme')
    return persisted === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme)
  }, [])

  function setColorScheme(nextScheme: ColorScheme) {
    setColorSchemeState(nextScheme)
    window.localStorage.setItem('graph-lab-color-scheme', nextScheme)
    document.documentElement.setAttribute('data-mantine-color-scheme', nextScheme)
  }

  function toggleColorScheme() {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
  }

  const value = useMemo<AppThemeContextValue>(
    () => ({ colorScheme, setColorScheme, toggleColorScheme }),
    [colorScheme],
  )

  return (
    <AppThemeContext.Provider value={value}>
      <MantineProvider theme={theme} forceColorScheme={colorScheme} defaultColorScheme="light">
        {children}
      </MantineProvider>
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  const context = useContext(AppThemeContext)
  if (context === null) {
    throw new Error('useAppTheme must be used inside AppThemeProvider')
  }
  return context
}


