import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState, type ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { Button } from '@/components/ui'
import { colors, fonts } from '@/theme'

export type Aviso = { icono: 'lock-outline' | 'clock-outline'; titulo: string; texto: string }

// Aviso informativo (módulo o lección bloqueada) en lugar del Alert gris del sistema.
export function AvisoInferior({ aviso, onCerrar }: { aviso: Aviso | null; onCerrar: () => void }) {
  // Se conserva el último aviso para que el texto no desaparezca mientras la hoja baja al cerrarse.
  const [ultimo, setUltimo] = useState(aviso)
  if (aviso && aviso !== ultimo) setUltimo(aviso)
  return (
    <HojaInferior
      visible={!!aviso}
      onCerrar={onCerrar}
      icono={<MaterialCommunityIcons name={ultimo?.icono ?? 'lock-outline'} size={48} color={colors.tertiary} />}
      titulo={ultimo?.titulo ?? ''}
      texto={ultimo?.texto ?? ''}
    >
      <Button title="Entendido" onPress={onCerrar} />
    </HojaInferior>
  )
}

// Hoja inferior del diseño "confirmacion_de_salida_tarjeta_kowit": sube desde abajo, esquinas de 28px,
// círculo con ícono, título, texto y botones. Sin `onCerrar` no se puede descartar (hay que elegir un botón).
export function HojaInferior({ visible, onCerrar, icono, fondoIcono = colors.tertiaryTint, titulo, texto, children }: {
  visible: boolean
  onCerrar?: () => void
  icono: ReactNode
  fondoIcono?: string
  titulo: string
  texto: string
  children: ReactNode
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar ?? (() => {})} statusBarTranslucent>
      <Pressable style={styles.velo} onPress={onCerrar} disabled={!onCerrar} accessibilityLabel="Cerrar" />
      <View style={styles.hoja}>
        <View style={styles.asa} />
        <View style={[styles.icono, { backgroundColor: fondoIcono }]}>{icono}</View>
        <Text style={styles.titulo} accessibilityRole="header">{titulo}</Text>
        <Text style={styles.texto}>{texto}</Text>
        <View style={styles.botones}>{children}</View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(22, 64, 58, 0.35)' },
  hoja: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40,
    alignItems: 'center', gap: 10,
  },
  asa: { width: 48, height: 5, borderRadius: 3, backgroundColor: colors.outline, marginBottom: 8 },
  icono: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, textAlign: 'center', marginTop: 8 },
  texto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
  botones: { alignSelf: 'stretch', gap: 12, marginTop: 8 },
})
