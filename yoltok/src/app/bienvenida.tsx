import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Input } from '@/components/ui'
import { mensajeError } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

// Login y registro en una sola pantalla. Al haber sesión, _layout.tsx manda al usuario a la app.
export default function Bienvenida() {
  const [modo, setModo] = useState<'entrar' | 'registro'>('entrar')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const registro = modo === 'registro'
  const completo = correo.trim() && contrasena && (!registro || nombre.trim())

  async function enviar() {
    setEnviando(true)
    setError(null)
    setAviso(null)
    const email = correo.trim().toLowerCase()
    if (registro) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: contrasena,
        options: { data: { nombre: nombre.trim() } },
      })
      if (error) setError(mensajeError(error))
      else if (!data.session) {
        setAviso('Te enviamos un correo para confirmar tu cuenta. Confírmalo y luego inicia sesión.')
        setModo('entrar')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: contrasena })
      if (error) setError(mensajeError(error))
    }
    setEnviando(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.brand}>Yoltok</Text>
            <Text style={styles.heroTitle}>{registro ? 'Crea tu cuenta' : '¡Panolti!'}</Text>
            <Text style={styles.heroText}>
              {registro
                ? 'Guarda tu progreso mientras aprendes náhuat del sur de Veracruz.'
                : 'Inicia sesión para seguir aprendiendo náhuat.'}
            </Text>
          </View>

          <View style={styles.form}>
            {registro && (
              <View>
                <Input label="Nombre" value={nombre} onChangeText={setNombre} placeholder="¿Cómo te llamas?" autoComplete="name" />
              </View>
            )}
            <View>
              <Input
                label="Correo"
                value={correo}
                onChangeText={setCorreo}
                placeholder="tucorreo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            <View>
              <Input
                label="Contraseña"
                value={contrasena}
                onChangeText={setContrasena}
                placeholder={registro ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                secureTextEntry
                autoComplete={registro ? 'new-password' : 'current-password'}
              />
            </View>

            {error && <Text style={[styles.mensaje, styles.error]} accessibilityLiveRegion="polite">{error}</Text>}
            {aviso && <Text style={[styles.mensaje, styles.aviso]} accessibilityLiveRegion="polite">{aviso}</Text>}

            <Button
              title={enviando ? 'Un momento…' : registro ? 'Crear cuenta' : 'Entrar'}
              onPress={enviar}
              disabled={!completo || enviando}
            />
            <Button
              variant="text"
              title={registro ? '¿Ya tienes cuenta? Inicia sesión' : '¿Eres nuevo? Crea una cuenta'}
              onPress={() => { setModo(registro ? 'entrar' : 'registro'); setError(null) }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 24, flexGrow: 1, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, borderBottomWidth: 4, borderBottomColor: colors.primaryLip },
  brand: { color: colors.primaryTint, fontFamily: fonts.heading, fontSize: 13, letterSpacing: 0.5, marginBottom: 8 },
  heroTitle: { color: '#FFFFFF', fontFamily: fonts.heading, fontSize: 28, lineHeight: 34 },
  heroText: { color: '#FFFFFF', fontFamily: fonts.body, fontSize: 15, lineHeight: 22, marginTop: 6 },
  form: { gap: 16 },
  mensaje: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, padding: 12, borderRadius: 12 },
  error: { color: colors.errorLip, backgroundColor: colors.errorTint },
  aviso: { color: colors.primaryDark, backgroundColor: colors.primaryTint },
})
