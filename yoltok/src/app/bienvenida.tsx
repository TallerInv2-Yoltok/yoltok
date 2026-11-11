import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Arcos, Emblema, GrecaAbajo, GrecaArriba } from '@/components/ornamentos'
import { PalabraDelDia } from '@/components/palabra-del-dia'
import { Button, Input } from '@/components/ui'
import { mensajeError } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

// Login y Crear cuenta (diseño «Yoltok Login»). Al haber sesión, _layout.tsx manda al usuario a la app.
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

  function cambiarModo() {
    setModo(registro ? 'entrar' : 'registro')
    setError(null)
  }

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
      <GrecaArriba />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Arcos estilo={registro ? { left: -170, top: 20 } : { right: -150, top: 40 }} />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {registro ? (
            <View style={styles.cabeza}>
              <View style={styles.marcaFila}>
                <Emblema tamano={44} />
                <Text style={styles.marcaChica}>Yoltok</Text>
              </View>
              <Text style={styles.titulo}>Crea tu cuenta</Text>
              <Text style={styles.subtitulo}>Guarda tu progreso mientras aprendes náhuatl del sur de Veracruz.</Text>
            </View>
          ) : (
            <View style={styles.cabeza}>
              <Emblema />
              <Text style={styles.marca}>Yoltok</Text>
            </View>
          )}

          <View style={styles.tarjeta}>
            {registro && (
              <Input label="Nombre" icono="account-outline" value={nombre} onChangeText={setNombre} placeholder="¿Cómo te llamas?" autoComplete="name" />
            )}
            <Input
              label="Correo electrónico"
              icono="email-outline"
              value={correo}
              onChangeText={setCorreo}
              placeholder={registro ? 'tucorreo@ejemplo.com' : 'tu.nombre@tecnm.mx'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              icono="lock-outline"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder={registro ? 'Mínimo 6 caracteres' : '••••••••••'}
              secureTextEntry
              autoComplete={registro ? 'new-password' : 'current-password'}
            />

            {error && <Text style={[styles.mensaje, styles.error]} accessibilityLiveRegion="polite">{error}</Text>}
            {aviso && <Text style={[styles.mensaje, styles.aviso]} accessibilityLiveRegion="polite">{aviso}</Text>}

            <Button
              title={enviando ? 'Un momento…' : registro ? 'Crear cuenta' : 'Iniciar sesión'}
              onPress={enviar}
              disabled={!completo || enviando}
              flecha={!enviando}
            />
          </View>

          {registro ? (
            <Text style={styles.cambio}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.enlace} onPress={cambiarModo} accessibilityRole="link">Inicia sesión</Text>
            </Text>
          ) : (
            <Button variant="outline" title="Crear cuenta" onPress={cambiarModo} flecha />
          )}

          <PalabraDelDia />
        </ScrollView>
      </KeyboardAvoidingView>
      <GrecaAbajo />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 26, paddingVertical: 28, gap: 22, flexGrow: 1, justifyContent: 'center', maxWidth: 440, width: '100%', alignSelf: 'center' },
  cabeza: { alignItems: 'center', gap: 8 },
  marca: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 44, letterSpacing: -1.2, color: colors.primaryDark },
  marcaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marcaChica: { fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.6, color: colors.primaryDark },
  titulo: { fontFamily: fonts.heading, fontSize: 28, letterSpacing: -0.6, color: colors.text, marginTop: 4 },
  subtitulo: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
  tarjeta: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.outline, borderRadius: 18, paddingVertical: 24, paddingHorizontal: 22, gap: 18,
    shadowColor: colors.primaryDark, shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 3,
  },
  mensaje: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, padding: 12, borderRadius: 12 },
  error: { color: colors.errorLip, backgroundColor: colors.errorTint },
  aviso: { color: colors.primaryText, backgroundColor: colors.primaryTint },
  cambio: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  enlace: { fontFamily: fonts.title, color: colors.primaryDark, textDecorationLine: 'underline' },
})
