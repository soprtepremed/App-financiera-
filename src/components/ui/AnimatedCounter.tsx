/**
 * AnimatedCounter - Contador numérico con animación premium
 * Efecto de conteo progresivo estilo banking apps
 */
import React, { useEffect } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
    useDerivedValue,
    useAnimatedReaction,
    runOnJS,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

interface AnimatedCounterProps {
    /** Valor numérico objetivo */
    value: number;
    /** Prefijo (ej: "$") */
    prefix?: string;
    /** Sufijo (ej: " MXN") */
    suffix?: string;
    /** Número de decimales a mostrar */
    decimals?: number;
    /** Duración de la animación en ms */
    duration?: number;
    /** Estilos del texto */
    textStyle?: TextStyle;
    /** Color del texto */
    color?: string;
    /** Tamaño predefinido */
    size?: 'sm' | 'md' | 'lg' | 'hero';
}

/**
 * Componente que anima un valor numérico de 0 al valor objetivo.
 * Ideal para mostrar balances, montos y totales con efecto premium.
 * 
 * Nota: Usa un estado React para actualizar el texto visible,
 * ya que los Text components no soportan animatedProps directamente.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    prefix = '$',
    suffix = '',
    decimals = 2,
    duration = 1000,
    textStyle,
    color = COLORS.text.primary,
    size = 'lg',
}) => {
    const animatedValue = useSharedValue(0);
    const [displayValue, setDisplayValue] = React.useState('0');

    /** Formatea un número a string con separadores de miles */
    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-MX', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    /** Callback ejecutado en el hilo JS para actualizar el estado */
    const updateDisplay = (val: number) => {
        setDisplayValue(formatNumber(val));
    };

    // Reacción animada: sincroniza el valor compartido con el estado
    useAnimatedReaction(
        () => animatedValue.value,
        (currentValue) => {
            runOnJS(updateDisplay)(currentValue);
        }
    );

    // Animación de conteo al cambiar el valor
    useEffect(() => {
        animatedValue.value = withTiming(value, {
            duration,
            easing: Easing.out(Easing.cubic),
        });
    }, [value]);

    return (
        <Text style={[styles.text, sizeStyles[size], { color }, textStyle]}>
            {prefix}{displayValue}{suffix}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        // currency_numbers: font-black tracking-tighter
        fontFamily: TYPOGRAPHY.family.bold,
        letterSpacing: TYPOGRAPHY.letterSpacing.tighter,
    },
});

/** Estilos predefinidos por tamaño — aligned with SmartWallet typography */
const sizeStyles: Record<string, TextStyle> = StyleSheet.create({
    sm: {
        fontSize: TYPOGRAPHY.size.lg,
    },
    md: {
        fontSize: TYPOGRAPHY.size['2xl'],
    },
    lg: {
        // currency text-4xl
        fontSize: TYPOGRAPHY.size['4xl'],
    },
    hero: {
        // currency text-5xl hero
        fontSize: TYPOGRAPHY.size.hero,
    },
});
