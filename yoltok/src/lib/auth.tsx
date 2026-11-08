import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'

type AuthState = { session: Session | null; cargando: boolean }

const AuthContext = createContext<AuthState>({ session: null, cargando: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, cargando: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, cargando: false }))
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      setState({ session, cargando: false })
      if (session) asegurarPerfil(session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

// No hay trigger en auth.users: la app crea la fila de `usuarios` en la primera sesión.
// Se hace aquí (y no en el registro) porque si el correo requiere confirmación no hay sesión al registrarse.
async function asegurarPerfil(session: Session) {
  const { data, error } = await supabase.from('usuarios').select('id').eq('id', session.user.id).maybeSingle()
  if (error || data) return
  const nombre = (session.user.user_metadata?.nombre as string | undefined) ?? ''
  const { error: errInsert } = await supabase
    .from('usuarios')
    .insert({ id: session.user.id, nombre, correo: session.user.email })
  // 23505 = otra llamada ya lo insertó (onAuthStateChange puede dispararse dos veces).
  if (errInsert && errInsert.code !== '23505') console.warn('No se pudo crear el perfil:', errInsert.message)
}

const MENSAJES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con ese correo.',
  email_not_confirmed: 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.',
  weak_password: 'La contraseña debe tener al menos 6 caracteres.',
  email_address_invalid: 'El correo no es válido.',
  over_email_send_rate_limit: 'Demasiados intentos. Espera unos minutos.',
}

export function mensajeError(error: { code?: string; message: string }) {
  return (error.code && MENSAJES[error.code]) || error.message
}
