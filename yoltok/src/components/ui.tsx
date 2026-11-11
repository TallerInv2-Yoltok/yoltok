import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useState, type ComponentProps } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { colors, fonts } from '@/theme'

type Icono = ComponentProps<typeof MaterialCommunityIcons>['name']

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'text'
  disabled?: boolean
  flecha?: boolean
}

// Botón del diseño «Yoltok Login»: esquinas de 12px, relleno sólido o contorno.
export function Button({ title, onPress, variant = 'primary', disabled, flecha }: ButtonProps) {
  if (variant === 'text') {
    return (
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={8}>
        <Text style={[styles.textButton, disabled && { color: colors.disabledText }]}>{title}</Text>
      </Pressable>
    )
  }
  const contorno = variant === 'outline'
  const bg = disabled ? colors.mutedTint : contorno ? 'transparent' : variant === 'primary' ? colors.primary : colors.secondary
  const fg = disabled ? colors.disabledText : contorno ? colors.primaryDark : '#FFFFFF'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        contorno && styles.outline,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text style={[styles.label, contorno && styles.labelOutline, { color: fg }]}>{title}</Text>
      {flecha && <MaterialCommunityIcons name="arrow-right" size={18} color={fg} />}
    </Pressable>
  )
}

// Campo con ícono a la izquierda; si es contraseña, ojo para mostrarla.
export function Input({ label, icono, ...props }: TextInputProps & { label: string; icono?: Icono }) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const secreto = props.secureTextEntry
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.campo, focused && styles.campoFocused]}>
        {icono && <MaterialCommunityIcons name={icono} size={18} color={colors.icon} />}
        <TextInput
          placeholderTextColor={colors.disabledText}
          {...props}
          secureTextEntry={secreto && !visible}
          accessibilityLabel={label}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          style={[styles.input, props.style]}
        />
        {secreto && (
          <Pressable
            onPress={() => setVisible(!visible)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={styles.ojo}
          >
            <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.icon} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: 12, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  outline: { height: 50, borderWidth: 1, borderColor: colors.primaryDark },
  label: { fontFamily: fonts.title, fontSize: 16 },
  labelOutline: { fontFamily: fonts.semibold, fontSize: 15 },
  textButton: { color: colors.primaryDark, fontFamily: fonts.title, fontSize: 14, textAlign: 'center' },
  inputLabel: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13 },
  campo: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingLeft: 14, paddingRight: 4,
    backgroundColor: colors.input, borderWidth: 1, borderColor: colors.outlineLip, borderRadius: 12,
  },
  campoFocused: { borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  input: { flex: 1, height: '100%', fontFamily: fonts.body, fontSize: 15, color: colors.text },
  ojo: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
})
