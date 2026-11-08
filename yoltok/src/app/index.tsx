import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Categoria = { id: string; nombre: string; descripcion: string | null }

// Pantalla de prueba: confirma que la app lee Supabase. Se reemplaza por la Ruta de aprendizaje.
export default function Index() {
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

  if (error) return <View style={styles.center}><Text style={styles.error}>Error: {error}</Text></View>
  if (!categorias) return <View style={styles.center}><ActivityIndicator /></View>

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={categorias}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.nombre}</Text>
          {item.descripcion && <Text>{item.descripcion}</Text>}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  error: { color: 'crimson' },
  list: { padding: 16, gap: 12 },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f2efe6' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
})
