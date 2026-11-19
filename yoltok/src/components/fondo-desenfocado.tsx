import { BlurTargetView, BlurView } from 'expo-blur'
import { createRef, type ComponentRef, type ReactNode } from 'react'
import { Pressable, StyleSheet, type View } from 'react-native'

type Vista = ComponentRef<typeof View>

// En Android el desenfoque necesita saber qué vista desenfocar: toda la app va dentro de este objetivo.
const objetivo = createRef<Vista>()

export function ObjetivoDesenfoque({ children }: { children: ReactNode }) {
  return <BlurTargetView ref={objetivo} style={{ flex: 1 }}>{children}</BlurTargetView>
}

// Velo de los modales: desenfoque ligero de la pantalla de atrás más un tinte jade suave. Tocarlo cierra.
export function VeloDesenfocado({ onPress }: { onPress: () => void }) {
  return (
    <>
      <BlurView intensity={18} tint="light" blurMethod="dimezisBlurViewSdk31Plus" blurTarget={objetivo} style={StyleSheet.absoluteFill} />
      <Pressable style={[StyleSheet.absoluteFill, styles.tinte]} onPress={onPress} accessibilityLabel="Cerrar menú" />
    </>
  )
}

const styles = StyleSheet.create({
  tinte: { backgroundColor: 'rgba(22, 64, 58, 0.18)' },
})
