import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router/js-tabs'

import { colors, fonts } from '@/theme'

// Barra inferior del diseño de Stitch. shortcut: falta Retos, agregarla cuando exista esa pantalla.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.title, fontSize: 12 },
        tabBarStyle: { borderTopWidth: 2, borderTopColor: colors.outline },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Aprender', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="glosario"
        options={{ title: 'Tlahtolli', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="book-open-variant" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color as string} size={size} /> }}
      />
    </Tabs>
  )
}
