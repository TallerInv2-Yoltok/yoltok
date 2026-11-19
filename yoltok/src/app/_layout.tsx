import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'

import { ObjetivoDesenfoque } from '@/components/fondo-desenfocado'
import { Button } from '@/components/ui'
import { AuthProvider, useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

export default function RootLayout() {
  const [fuentesListas] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })
  if (!fuentesListas) return null

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <ObjetivoDesenfoque>
        <Rutas />
      </ObjetivoDesenfoque>
    </AuthProvider>
  )
}

// Sin sesión solo existe "bienvenida"; con sesión, el resto de la app.
function Rutas() {
  const { session, cargando, error, reintentar } = useAuth()
  if (cargando) return null
  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTitulo}>No pudimos preparar tu cuenta</Text>
        <Text style={styles.errorTexto}>Revisa tu conexión e inténtalo de nuevo. ({error})</Text>
        <View style={{ alignSelf: 'stretch', gap: 12 }}>
          <Button title="Reintentar" onPress={reintentar} />
          <Button variant="text" title="Cerrar sesión" onPress={() => supabase.auth.signOut()} />
        </View>
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ruta/[categoria]" />
        <Stack.Screen name="leccion/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="encuesta" />
        <Stack.Screen name="guia/[id]" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="bienvenida" />
      </Stack.Protected>
    </Stack>
  )
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.background },
  errorTitulo: { fontFamily: fonts.heading, fontSize: 22, color: colors.text, textAlign: 'center' },
  errorTexto: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
})
