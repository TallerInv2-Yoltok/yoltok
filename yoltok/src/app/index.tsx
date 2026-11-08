import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Categoria = { id: string; nombre: string; descripcion: string | null }

// Pantalla de prueba: confirma sesión y lectura de Supabase. Se reemplaza por la Ruta de aprendizaje.
export default function Index() {
  const { session } = useAuth()
  const [categorias, setCategorias] = useState<Categoria[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('categorias')
      .select('id, nombre, descripcion')
      .order('orden')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCategorias(data)
      })
  }, [])

  const nombre = session?.user.user_metadata?.nombre as string | undefined

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.list}
        data={categorias ?? []}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={{ gap: 4 }}>
            <Text style={styles.hola}>¡Panolti{nombre ? `, ${nombre}` : ''}!</Text>
            <Text style={styles.muted}>{session?.user.email}</Text>
            {error && <Text style={styles.error}>Error: {error}</Text>}
            {!categorias && !error && <ActivityIndicator style={{ marginTop: 16 }} />}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.nombre}</Text>
            {item.descripcion && <Text style={styles.body}>{item.descripcion}</Text>}
          </View>
        )}
        ListFooterComponent={<Button variant="text" title="Cerrar sesión" onPress={() => supabase.auth.signOut()} />}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12 },
  hola: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  error: { fontFamily: fonts.body, color: colors.errorLip },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.outline,
    borderBottomWidth: 4,
    backgroundColor: '#FFFFFF',
  },
  title: { fontFamily: fonts.title, fontSize: 18, color: colors.text, marginBottom: 4 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
})
