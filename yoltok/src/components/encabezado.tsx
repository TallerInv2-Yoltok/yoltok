import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { Emblema, GrecaArriba } from '@/components/ornamentos'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Perfil = { nombre: string; puntos: number; vidas: number }

// Barra superior del diseño: marca (o botón atrás), vidas, XP y menú de cuenta.
export function Encabezado({ atras }: { atras?: boolean }) {
  const { session } = useAuth()
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  useFocusEffect(useCallback(() => {
    if (!session) return // al cerrar sesión la pantalla aún se pinta una vez sin sesión
    supabase
      .from('usuarios')
      .select('nombre, puntos, vidas')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPerfil(data))
  }, [session]))

  function menuPerfil() {
    Alert.alert(perfil?.nombre || 'Tu cuenta', session?.user.email, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
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
          <Pressable onPress={menuPerfil} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Mi cuenta">
            <MaterialCommunityIcons name="account-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
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
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
})
