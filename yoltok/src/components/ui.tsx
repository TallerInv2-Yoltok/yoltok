import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native'

import { colors, fonts } from '@/theme'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'text'
  disabled?: boolean
}

// Botón "táctil" del diseño: labio inferior de 4px que se hunde al presionar.
export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
  if (variant === 'text') {
    return (
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" hitSlop={8}>
        <Text style={styles.textButton}>{title}</Text>
      </Pressable>
    )
  }
  const bg = disabled ? colors.outline : variant === 'primary' ? colors.primary : colors.secondary
  const lip = disabled ? colors.outlineLip : variant === 'primary' ? colors.primaryLip : colors.secondaryLip
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderBottomColor: lip },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, disabled && { color: colors.disabledText }]}>{title.toUpperCase()}</Text>
    </Pressable>
  )
}

export function Input(props: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <Text style={styles.inputLabel}>{props.label}</Text>
      <TextInput
        placeholderTextColor={colors.disabledText}
        {...props}
        accessibilityLabel={props.label}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        style={[styles.input, focused && styles.inputFocused, props.style]}
      />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 9999,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: { transform: [{ translateY: 4 }], borderBottomWidth: 0 },
  label: { color: '#FFFFFF', fontFamily: fonts.heading, fontSize: 15, letterSpacing: 0.5 },
  textButton: { color: colors.secondaryLip, fontFamily: fonts.title, fontSize: 15, textAlign: 'center' },
  inputLabel: { color: colors.text, fontFamily: fonts.title, fontSize: 15, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.outlineLip,
    paddingHorizontal: 16,
    height: 52,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.secondary, backgroundColor: '#FFFFFF' },
})
