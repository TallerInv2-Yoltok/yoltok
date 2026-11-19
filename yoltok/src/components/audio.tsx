import { MaterialCommunityIcons } from '@expo/vector-icons'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

export type EstadoAudio = 'listo' | 'cargando' | 'error'
type Aviso = (estado: EstadoAudio) => void

// Un solo reproductor para toda la app: tocar otra palabra corta la anterior.
let reproductor: AudioPlayer | null = null
let suscripcion: { remove: () => void } | null = null
let temporizador: ReturnType<typeof setTimeout> | null = null
let avisar: Aviso | null = null // botón que está sonando ahora

// Suelta el evento y el temporizador del audio actual y le dice a su botón cómo terminó.
function terminar(estado: EstadoAudio | null) {
  suscripcion?.remove()
  suscripcion = null
  if (temporizador) clearTimeout(temporizador)
  temporizador = null
  const a = avisar
  avisar = null
  if (estado) a?.(estado)
}

// audio_path = nombre exacto del archivo en el bucket público «Audios» (mayúsculas y espacios incluidos).
export function reproducir(audioPath: string, onEstado?: Aviso) {
  terminar('listo') // el botón anterior vuelve a reposo
  avisar = onEstado ?? null
  avisar?.('cargando')
  try {
    const url = supabase.storage.from('Audios').getPublicUrl(audioPath).data.publicUrl
    if (!reproductor) reproductor = createAudioPlayer(url)
    else reproductor.replace(url)
    // La descarga falla de forma asíncrona: llega como status.error, no como excepción.
    suscripcion = reproductor.addListener('playbackStatusUpdate', (s) => {
      if (s.error) {
        console.warn(`Audio «${audioPath}»:`, s.error)
        terminar('error')
      } else if (s.didJustFinish) terminar('listo')
      else if (s.playing) avisar?.('listo')
    })
    // shortcut: 10 s sin empezar a sonar se toma como fallo; subirlo si hay audios largos en redes lentas.
    temporizador = setTimeout(() => {
      if (!reproductor?.playing) terminar('error')
    }, 10_000)
    reproductor.play()
  } catch (e) {
    console.warn(`Audio «${audioPath}»:`, e)
    terminar('error')
  }
}

// Detiene el audio. Con `dueno`, solo si es ese botón el que está sonando.
export function detener(dueno?: Aviso) {
  if (dueno && avisar !== dueno) return
  try {
    reproductor?.pause()
  } catch {}
  terminar(null)
}

// Botón azul de audio del diseño (labio inferior de 4px). Muestra carga y, si falla, un aviso para reintentar.
export function BotonAudio({ audioPath, tamano = 52, etiqueta }: { audioPath: string; tamano?: number; etiqueta: string }) {
  const [estado, setEstado] = useState<EstadoAudio>('listo')
  // Al salir de la pantalla se corta su audio y se sueltan evento y temporizador.
  useEffect(() => () => detener(setEstado), [])

  const error = estado === 'error'
  return (
    <View style={styles.caja}>
      <Pressable
        onPress={() => reproducir(audioPath, setEstado)}
        accessibilityRole="button"
        accessibilityLabel={error ? `No se pudo reproducir ${etiqueta}. Toca para reintentar` : `Escuchar ${etiqueta}`}
        accessibilityState={{ busy: estado === 'cargando' }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.boton,
          { width: tamano, height: tamano, borderRadius: tamano / 2 },
          error && styles.botonError,
          pressed && { transform: [{ translateY: 4 }], borderBottomWidth: 0 },
        ]}
      >
        {estado === 'cargando' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name={error ? 'reload' : 'volume-high'} size={tamano * 0.5} color="#FFFFFF" />
        )}
      </Pressable>
      {error && <Text style={styles.aviso} accessibilityLiveRegion="polite">Sin audio. Toca para reintentar</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  caja: { alignItems: 'center', gap: 4 },
  boton: { backgroundColor: colors.secondary, borderBottomWidth: 4, borderBottomColor: colors.secondaryLip, alignItems: 'center', justifyContent: 'center' },
  botonError: { backgroundColor: colors.error, borderBottomColor: colors.errorLip },
  aviso: { fontFamily: fonts.semibold, fontSize: 11, color: colors.errorLip, textAlign: 'center', maxWidth: 120 },
})
