/**
 * ProgressRing - Anillo de progreso animado
 * Usado en metas de ahorro con porcentaje y texto central
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
    /** Progreso actual (0-100) */
    progress: number;
    /** Tamaño del anillo (diámetro) */
    size?: number;
    /** Grosor del trazo */
    strokeWidth?: number;
    /** Color del progreso */
    color?: string;
    /** Color del fondo del anillo */
    trackColor?: string;
    /** Texto principal central (ej: "$10,800") */
    centerText?: string;
    /** Subtexto central (ej: "de $15,000") */
    subText?: string;
    /** Estilo adicional */
    style?: ViewStyle;
}

/**
 * Anillo SVG animado para visualizar progreso de metas.
 * El progreso se anima suavemente de 0 al valor objetivo.
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 160,
    strokeWidth = 12,
    color = COLORS.accent.primary,
    trackColor = COLORS.background.tertiary,
    centerText,
    subText,
    style,
}) => {
    const animatedProgress = useSharedValue(0);
    const clampedProgress = Math.min(100, Math.max(0, progress));

    // Cálculos del círculo SVG
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    useEffect(() => {
        animatedProgress.value = withTiming(clampedProgress, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        });
    }, [clampedProgress]);

    /** Props animados: strokeDashoffset controla el arco visible */
    const animatedProps = useAnimatedProps(() => {
        const offset = circumference - (animatedProgress.value / 100) * circumference;
        return {
            strokeDashoffset: offset,
        };
    });

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Svg width={size} height={size}>
                {/* Track (fondo del anillo) */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress (arco animado) */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    // Rotar -90° para que empiece desde arriba
                    rotation={-90}
                    origin={`${center}, ${center}`}
                />
            </Svg>

            {/* Contenido central */}
            <View style={styles.centerContent}>
                {centerText && (
                    <Text style={styles.centerText}>{centerText}</Text>
                )}
                {subText && (
                    <Text style={styles.subText}>{subText}</Text>
                )}
                <Text style={[styles.percentText, { color }]}>
                    {Math.round(clampedProgress)}%
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerText: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'],
        color: COLORS.text.primary,
    },
    subText: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.text.tertiary,
        marginTop: 2,
    },
    percentText: {
        fontFamily: TYPOGRAPHY.family.semibold,
        fontSize: TYPOGRAPHY.size.sm,
        marginTop: SPACING.xs,
    },
});
