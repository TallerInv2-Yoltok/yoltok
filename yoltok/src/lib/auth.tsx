import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'

type AuthState = { session: Session | null; cargando: boolean; error: string | null; reintentar: () => void }

const AuthContext = createContext<AuthState>({ session: null, cargando: true, error: null, reintentar: () => {} })

// La sesión solo se expone cuando su fila de `usuarios` ya existe: así ninguna pantalla corre sin perfil.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let turno = 0 // cada evento invalida las respuestas pendientes de los anteriores (p. ej. un cierre de sesión)
    let perfilListo: string | null = null // usuario cuyo perfil ya se comprobó (los refrescos de token no vuelven a consultar)
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      const mio = ++turno
      // Supabase recomienda no llamar a la API dentro de este callback (puede bloquearse): se difiere.
      setTimeout(async () => {
        const fallo = nueva && perfilListo !== nueva.user.id ? await asegurarPerfil(nueva) : null
        if (mio !== turno) return
        if (fallo) {
          setError(fallo)
          setSession(null)
        } else {
          perfilListo = nueva?.user.id ?? null
          setError(null)
          setSession(nueva)
        }
        setCargando(false)
      }, 0)
    })
    return () => {
      turno = -1
      data.subscription.unsubscribe()
    }
  }, [intento])

  // Volver a suscribirse repite el evento inicial y con él la comprobación del perfil.
  function reintentar() {
    setError(null)
    setCargando(true)
    setIntento((i) => i + 1)
  }

  return <AuthContext.Provider value={{ session, cargando, error, reintentar }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

// No hay trigger en auth.users: la app crea la fila de `usuarios` en la primera sesión.
// Se hace aquí (y no en el registro) porque si el correo requiere confirmación no hay sesión al registrarse.
// Devuelve el mensaje de error, o null si el perfil existe.
async function asegurarPerfil(session: Session): Promise<string | null> {
  const { data, error } = await supabase.from('usuarios').select('id').eq('id', session.user.id).maybeSingle()
  if (error) return error.message
  if (data) return null
  const nombre = (session.user.user_metadata?.nombre as string | undefined) ?? ''
  const { error: errInsert } = await supabase
    .from('usuarios')
    .insert({ id: session.user.id, nombre, correo: session.user.email })
  // 23505 = otra llamada ya lo insertó.
  return errInsert && errInsert.code !== '23505' ? errInsert.message : null
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
