import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/config'
import { type AccessToken, requestAccessToken } from '@/google/auth'

interface AuthContextValue {
  /** Il token, se c'è e non sta per scadere. */
  token?: string
  /** C'è un Client ID: la sincronizzazione è possibile. */
  available: boolean
  /** L'utente ha collegato Google almeno una volta su questo dispositivo. */
  linked: boolean
  signingIn: boolean
  /** Apre il popup di Google: va chiamata da un click. */
  signIn: () => Promise<void>
  /** Scollega Google da questo dispositivo; i dati restano. */
  unlink: () => void
  /** Dimentica il token scaduto o revocato, ma resta collegato. */
  expire: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const EXPIRY_MARGIN_MS = 60_000
const LINKED_KEY = 'profclick.google'

function readLinked(): boolean {
  try {
    return localStorage.getItem(LINKED_KEY) === '1'
  } catch {
    return false
  }
}

function writeLinked(linked: boolean) {
  try {
    if (linked) localStorage.setItem(LINKED_KEY, '1')
    else localStorage.removeItem(LINKED_KEY)
  } catch {
    // Senza localStorage si rifà solo il collegamento alla prossima apertura.
  }
}

/**
 * Il login Google è facoltativo (ADR 0001): ProfClick funziona subito sul dispositivo, e
 * con Google i dati passano anche dal Drive per averli uguali su PC e telefono. Il token
 * vive solo in memoria e dura un'ora: dopo basta un tocco per rinnovarlo.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<AccessToken>()
  const [signingIn, setSigningIn] = useState(false)
  const [linked, setLinked] = useState(readLinked)

  const signIn = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) return
    setSigningIn(true)
    try {
      setToken(await requestAccessToken(GOOGLE_CLIENT_ID, GOOGLE_SCOPES))
      setLinked(true)
      writeLinked(true)
    } catch (e) {
      toast.error('Accesso a Google non riuscito', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSigningIn(false)
    }
  }, [])

  const unlink = useCallback(() => {
    if (token) google.accounts.oauth2.revoke(token.value, () => {})
    setToken(undefined)
    setLinked(false)
    writeLinked(false)
  }, [token])

  const expire = useCallback(() => setToken(undefined), [])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => setToken(undefined), Math.max(0, token.expiresAt - Date.now() - EXPIRY_MARGIN_MS))
    return () => clearTimeout(timer)
  }, [token])

  return (
    <AuthContext.Provider value={{ token: token?.value, available: GOOGLE_CLIENT_ID !== '', linked, signingIn, signIn, unlink, expire }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth va usato dentro AuthProvider')
  return value
}
