import { MaterialCommunityIcons } from '@expo/vector-icons'
import { createAudioPlayer, type AudioPlayer } from 'expo-audio'
import { Pressable, StyleSheet } from 'react-native'

import { supabase } from '@/lib/supabase'
import { colors } from '@/theme'

// Un solo reproductor para toda la app: tocar otra palabra corta la anterior.
let reproductor: AudioPlayer | null = null

// audio_path = nombre del archivo en el bucket público «Audios» de Supabase Storage.
export function reproducir(audioPath: string) {
  const url = supabase.storage.from('Audios').getPublicUrl(audioPath).data.publicUrl
  if (!reproductor) reproductor = createAudioPlayer(url)
  else reproductor.replace(url)
  reproductor.play()
}

// Botón azul de audio del diseño (labio inferior de 4px).
export function BotonAudio({ audioPath, tamano = 52, etiqueta }: { audioPath: string; tamano?: number; etiqueta: string }) {
  return (
    <Pressable
      onPress={() => reproducir(audioPath)}
      accessibilityRole="button"
      accessibilityLabel={`Escuchar ${etiqueta}`}
      hitSlop={6}
      style={({ pressed }) => [
        styles.boton,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
        pressed && { transform: [{ translateY: 4 }], borderBottomWidth: 0 },
      ]}
    >
      <MaterialCommunityIcons name="volume-high" size={tamano * 0.5} color="#FFFFFF" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  boton: { backgroundColor: colors.secondary, borderBottomWidth: 4, borderBottomColor: colors.secondaryLip, alignItems: 'center', justifyContent: 'center' },
})
