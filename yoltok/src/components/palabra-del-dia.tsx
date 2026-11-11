import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { GlifoFlor } from '@/components/ornamentos'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/theme'

type Palabra = { palabra_nahuat: string; traduccion_espanol: string }

// «Palabra del día: Xochitl · flor» del diseño. Sale de la tabla palabras (validadas), una distinta cada día.
export function PalabraDelDia({ tarjeta }: { tarjeta?: boolean }) {
  const [palabra, setPalabra] = useState<Palabra | null>(null)

  useEffect(() => {
    supabase
      .from('palabras')
      .select('palabra_nahuat, traduccion_espanol')
      .neq('palabra_nahuat', '')
      .order('id')
      .then(({ data }) => {
        if (data?.length) setPalabra(data[Math.floor(Date.now() / 86_400_000) % data.length])
      })
  }, [])

  if (!palabra) return null
  return (
    <View style={[styles.fila, tarjeta ? styles.tarjeta : styles.linea]} accessible accessibilityLabel={`Palabra del día: ${palabra.palabra_nahuat}, ${palabra.traduccion_espanol}`}>
      <GlifoFlor />
      <Text style={styles.texto}>
        <Text style={styles.etiqueta}>Palabra del día: </Text>
        <Text style={styles.palabra}>{palabra.palabra_nahuat}</Text> · {palabra.traduccion_espanol.toLowerCase()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linea: { justifyContent: 'center', paddingTop: 18, marginTop: 6, borderTopWidth: 1, borderTopColor: colors.outline },
  tarjeta: { padding: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.outline, borderRadius: 14 },
  texto: { flexShrink: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  etiqueta: { fontFamily: fonts.semibold, color: colors.tertiaryLip },
  palabra: { fontFamily: fonts.title, color: colors.primaryDark },
})
