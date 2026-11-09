import { NunitoSans_700Bold, NunitoSans_800ExtraBold } from '@expo-google-fonts/nunito-sans'
import { PlusJakartaSans_500Medium, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider, useAuth } from '@/lib/auth'

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  })
  if (!fuentesListas) return null

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Rutas />
    </AuthProvider>
  )
}

// Sin sesión solo existe "bienvenida"; con sesión, el resto de la app.
function Rutas() {
  const { session, cargando } = useAuth()
  if (cargando) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ruta/[categoria]" />
        <Stack.Screen name="leccion/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="encuesta" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="bienvenida" />
      </Stack.Protected>
    </Stack>
  )
}
