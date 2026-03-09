/**
 * ProgressBar - Barra de progreso animada
 * Usada en presupuestos por categoría y ciclos de tarjeta
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface ProgressBarProps {
    /** Progreso actual (0-100) */
    progress: number;
    /** Color de la barra de progreso */
    color?: string;
    /** Color del fondo de la barra */
    trackColor?: string;
    /** Altura de la barra */
    height?: number;
    /** Mostrar el porcentaje de texto */
    showPercentage?: boolean;
    /** Etiqueta opcional */
    label?: string;
    /** Valor formateado (ej: "$5,200") */
    valueText?: string;
    /** Estilo adicional del contenedor */
    style?: ViewStyle;
    /** Si debe animar al montar */
    animated?: boolean;
}

/**
 * Barra de progreso con animación de entrada y colores dinámicos.
 * Calcula automáticamente el estado visual (safe/warning/danger)
 * según el porcentaje cuando no se especifica color.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    color,
    trackColor = COLORS.background.tertiary,
    height = 8,
    showPercentage = false,
    label,
    valueText,
    style,
    animated = true,
}) => {
    const animatedWidth = useSharedValue(0);
    // Limitar entre 0 y 100
    const clampedProgress = Math.min(100, Math.max(0, progress));

    // Color automático basado en progreso si no se especifica
    const barColor = color ?? getProgressColor(clampedProgress);

    useEffect(() => {
        if (animated) {
            animatedWidth.value = withTiming(clampedProgress, {
                duration: 800,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            animatedWidth.value = clampedProgress;
        }
    }, [clampedProgress]);

    /** Estilo animado: ancho proporcional al progreso */
    const barStyle = useAnimatedStyle(() => ({
        width: `${animatedWidth.value}%` as unknown as number,
    }));

    return (
        <View style={[styles.wrapper, style]}>
            {/* Header con label y valor */}
            {(label || valueText || showPercentage) && (
                <View style={styles.header}>
                    {label && <Text style={styles.label}>{label}</Text>}
                    <View style={styles.valueContainer}>
                        {valueText && (
                            <Text style={styles.valueText}>{valueText}</Text>
                        )}
                        {showPercentage && (
                            <Text style={[styles.percentage, { color: barColor }]}>
                                {Math.round(clampedProgress)}%
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Barra de progreso */}
            <View style={[styles.track, { height, backgroundColor: trackColor }]}>
                <Animated.View
                    style={[
                        styles.bar,
                        barStyle,
                        {
                            height,
                            backgroundColor: barColor,
                        },
                    ]}
                />
            </View>
        </View>
    );
};

/**
 * Determina el color de la barra según el porcentaje.
 * - 0-60%: Verde (safe)
 * - 60-80%: Ámbar (warning)
 * - 80-100%: Rojo (danger)
 */
function getProgressColor(progress: number): string {
    if (progress <= 60) return COLORS.accent.success;
    if (progress <= 80) return COLORS.accent.warning;
    return COLORS.accent.danger;
}

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    label: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text.secondary,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    valueText: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text.primary,
    },
    percentage: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.xs,
    },
    track: {
        width: '100%',
        borderRadius: RADIUS.full,
        overflow: 'hidden',
    },
    bar: {
        borderRadius: RADIUS.full,
    },
});
