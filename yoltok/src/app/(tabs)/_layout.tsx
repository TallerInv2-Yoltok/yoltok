import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router/js-tabs'
import type { ComponentProps } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { GrecaAbajo } from '@/components/ornamentos'
import { colors, fonts } from '@/theme'

type Icono = ComponentProps<typeof MaterialCommunityIcons>['name']

// Ícono con la rayita superior de la pestaña activa (diseño «Yoltok Login»).
const icono = (nombre: Icono) =>
  function IconoPestana({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return (
      <View style={styles.icono}>
        {focused && <View style={styles.activa} />}
        <MaterialCommunityIcons name={nombre} color={color} size={size} />
      </View>
    )
  }

const GRECA = 12

// Barra inferior. shortcut: falta Retos, agregarla cuando exista esa pantalla.
export default function TabsLayout() {
  // La greca va en su propio espacio debajo de las etiquetas: cada teléfono tiene distinto margen inferior
  // (botones o barra de gestos), así que se suma al margen en vez de dibujarse encima.
  const { bottom } = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.title, fontSize: 12 },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.outline,
          backgroundColor: colors.card,
          height: 60 + GRECA + bottom,
          paddingTop: 6,
          paddingBottom: GRECA + bottom,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: colors.card }}>
            <View style={styles.greca}><GrecaAbajo /></View>
          </View>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aprender', tabBarIcon: icono('map-outline') as never }} />
      <Tabs.Screen name="glosario" options={{ title: 'Tlahtolli', tabBarIcon: icono('book-open-outline') as never }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('account-circle-outline') as never }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  icono: { alignItems: 'center' },
  activa: { position: 'absolute', top: -8, width: 36, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: colors.primary },
  greca: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
