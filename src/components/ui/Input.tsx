/**
 * Input - Campo de texto premium con efecto glass
 * Soporta iconos, etiquetas, validación y estados de error.
 * Se suscribe al themeStore para reaccionar al tema.
 */
import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    Pressable,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, ANIMATION } from '../../constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
    /** Etiqueta del campo */
    label: string;
    /** Mensaje de error */
    error?: string;
    /** Texto de ayuda debajo del campo */
    helperText?: string;
    /** Icono izquierdo */
    leftIcon?: React.ReactNode;
    /** Icono derecho (ej: ojo para password) */
    rightIcon?: React.ReactNode;
    /** Acción al presionar icono derecho */
    onRightIconPress?: () => void;
    /** Estilo del contenedor externo */
    containerStyle?: ViewStyle;
}

/**
 * Campo de texto con estética glass premium.
 * Tema reactivo — usa useThemeStore internamente.
 */
export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    ...textInputProps
}) => {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const focusAnim = useSharedValue(0);

    /** Borde animado: cambia de color al enfocar */
    const animatedBorderStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            focusAnim.value,
            [0, 1],
            [C.border.primary, C.accent.primary]
        );
        return { borderColor };
    });

    const handleFocus = () => {
        setIsFocused(true);
        focusAnim.value = withTiming(1, { duration: ANIMATION.duration.normal });
    };

    const handleBlur = () => {
        setIsFocused(false);
        focusAnim.value = withTiming(0, { duration: ANIMATION.duration.normal });
    };

    const hasError = !!error;

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {/* Label */}
            <Text style={[
                styles.label,
                { color: hasError ? C.accent.danger : C.text.secondary },
            ]}>
                {label}
            </Text>

            {/* Contenedor del input */}
            <Animated.View
                style={[
                    styles.container,
                    { backgroundColor: C.background.tertiary },
                    animatedBorderStyle,
                    hasError && { borderColor: C.accent.danger },
                ]}
            >
                {/* Icono izquierdo */}
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

                {/* Campo de texto */}
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.input,
                        { color: C.text.primary },
                        leftIcon ? styles.inputWithLeftIcon : null,
                        rightIcon ? styles.inputWithRightIcon : null,
                    ]}
                    placeholderTextColor={C.text.tertiary}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    selectionColor={C.accent.primary}
                    {...textInputProps}
                />

                {/* Icono derecho */}
                {rightIcon && (
                    <Pressable
                        style={styles.iconRight}
                        onPress={onRightIconPress}
                        hitSlop={8}
                    >
                        {rightIcon}
                    </Pressable>
                )}
            </Animated.View>

            {/* Mensaje de error o ayuda */}
            {hasError && (
                <Text style={[styles.helperText, { color: C.accent.danger }]}>{error}</Text>
            )}
            {!hasError && helperText && (
                <Text style={[styles.helperText, { color: C.text.tertiary }]}>{helperText}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        minHeight: 52,
    },
    input: {
        flex: 1,
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    inputWithLeftIcon: {
        paddingLeft: SPACING.xs,
    },
    inputWithRightIcon: {
        paddingRight: SPACING.xs,
    },
    iconLeft: {
        paddingLeft: SPACING.md,
    },
    iconRight: {
        paddingRight: SPACING.md,
    },
    helperText: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: SPACING.xs,
        marginLeft: SPACING.xs,
    },
});
