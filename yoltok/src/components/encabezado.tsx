import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState, type ComponentProps } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { VeloDesenfocado } from '@/components/fondo-desenfocado'
import { Emblema, GrecaArriba } from '@/components/ornamentos'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Perfil = { nombre: string; puntos: number; vidas: number }

// Barra superior del diseño: marca (o botón atrás), vidas, XP y menú de cuenta.
export function Encabezado({ atras }: { atras?: boolean }) {
  const { session } = useAuth()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [menu, setMenu] = useState(false)
  const [confirmar, setConfirmar] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!session) return // al cerrar sesión la pantalla aún se pinta una vez sin sesión
    supabase
      .from('usuarios')
      .select('nombre, puntos, vidas')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPerfil(data))
  }, [session]))

  function cerrarMenu() {
    setMenu(false)
    setConfirmar(false)
  }

  function ir(ruta: '/perfil' | '/encuesta') {
    cerrarMenu()
    router.push(ruta)
  }

  return (
    <View>
      <GrecaArriba />
      <View style={styles.header}>
        {atras ? (
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.marca}>
            <Emblema tamano={30} />
            <Text style={styles.brand}>Yoltok</Text>
          </View>
        )}
        <View style={styles.derecha}>
          <Chip icono="heart" color={colors.error} texto={String(perfil?.vidas ?? 0)} label="vidas" />
          <Chip icono="star" color={colors.tertiary} texto={`${perfil?.puntos ?? 0} XP`} label="puntos" />
          <Pressable onPress={() => setMenu(true)} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Mi cuenta">
            <MaterialCommunityIcons name="account-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Menú de cuenta con la identidad de Yoltok (en lugar del Alert gris del sistema). */}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={cerrarMenu} statusBarTranslucent>
        <VeloDesenfocado onPress={cerrarMenu} />
        <View style={styles.menuCaja} pointerEvents="box-none">
          <View style={styles.menu}>
            <View style={styles.menuPerfil}>
              <View style={styles.menuAvatar}>
                <MaterialCommunityIcons name="account" size={30} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuNombre} numberOfLines={1}>{perfil?.nombre || 'Estudiante'}</Text>
                <Text style={styles.menuCorreo} numberOfLines={1}>{session?.user.email}</Text>
                <Text style={styles.menuTec}>TecNM Campus Minatitlán</Text>
              </View>
            </View>
            <View style={styles.menuResumen}>
              <Chip icono="heart" color={colors.error} texto={String(perfil?.vidas ?? 0)} label="vidas" />
              <Chip icono="star" color={colors.tertiary} texto={`${perfil?.puntos ?? 0} XP`} label="puntos" />
            </View>

            {confirmar ? (
              <View style={{ gap: 12 }} accessibilityLiveRegion="polite">
                <Text style={styles.confirmar}>¿Seguro que quieres cerrar sesión?</Text>
                <Button title="Sí, cerrar sesión" onPress={() => { cerrarMenu(); supabase.auth.signOut() }} />
                <Button variant="text" title="Cancelar" onPress={() => setConfirmar(false)} />
              </View>
            ) : (
              <View>
                <Opcion icono="account-circle-outline" texto="Mi perfil y metas" onPress={() => ir('/perfil')} />
                <Opcion icono="clipboard-check-outline" texto="Encuesta académica (ISO 9241-11)" onPress={() => ir('/encuesta')} />
                <Opcion icono="logout" texto="Cerrar sesión" peligro onPress={() => setConfirmar(true)} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

function Opcion({ icono, texto, peligro, onPress }: {
  icono: ComponentProps<typeof MaterialCommunityIcons>['name']; texto: string; peligro?: boolean; onPress: () => void
}) {
  const color = peligro ? colors.error : colors.primaryDark
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.opcion, pressed && { backgroundColor: colors.mutedTint }]}>
      <MaterialCommunityIcons name={icono} size={22} color={color} />
      <Text style={[styles.opcionTexto, { color }]}>{texto}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.icon} />
    </Pressable>
  )
}

function Chip({ icono, color, texto, label }: { icono: 'heart' | 'star'; color: string; texto: string; label: string }) {
  return (
    <View style={styles.chip} accessible accessibilityLabel={`${texto} ${label}`}>
      <MaterialCommunityIcons name={icono} size={16} color={color} />
      <Text style={styles.chipTexto}>{texto}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: colors.primaryDark },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 9999,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  chipTexto: { fontFamily: fonts.title, fontSize: 14, color: colors.text },
  menuCaja: { flex: 1, justifyContent: 'center', padding: 20 },
  menu: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20, gap: 16, width: '100%', maxWidth: 420, alignSelf: 'center',
    borderWidth: 2, borderColor: colors.outline, borderBottomWidth: 4, borderBottomColor: colors.outlineLip,
  },
  menuPerfil: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  menuNombre: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  menuCorreo: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  menuTec: { fontFamily: fonts.semibold, fontSize: 11, color: colors.tertiaryLip, marginTop: 2 },
  menuResumen: { flexDirection: 'row', gap: 8 },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 12, borderTopWidth: 1, borderTopColor: colors.outline },
  opcionTexto: { flex: 1, fontFamily: fonts.title, fontSize: 15 },
  confirmar: { fontFamily: fonts.title, fontSize: 16, color: colors.text, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
})
