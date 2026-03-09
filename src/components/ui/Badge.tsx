/**
 * Badge - Etiqueta de estado compacta
 * Indicadores de estado para tarjetas, alertas y categorías
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    /** Texto del badge */
    text: string;
    /** Variante de color */
    variant?: BadgeVariant;
    /** Tamaño */
    size?: BadgeSize;
    /** Icono (emoji o componente) */
    icon?: string;
    /** Estilo adicional */
    style?: ViewStyle;
}

/** Mapa de colores por variante — SmartWallet icon container colors */
const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: COLORS.iconContainer.success, text: COLORS.iconContainer.successText },
    warning: { bg: COLORS.iconContainer.warning, text: COLORS.iconContainer.warningText },
    danger: { bg: COLORS.iconContainer.danger, text: COLORS.iconContainer.dangerText },
    info: { bg: COLORS.iconContainer.primary, text: COLORS.iconContainer.primaryText },
    neutral: { bg: COLORS.background.tertiary, text: COLORS.text.secondary },
};

/**
 * Badge compacto para indicar estados de forma visual.
 * Usa fondos con opacidad para mantener la estética glass.
 */
export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'neutral',
    size = 'sm',
    icon,
    style,
}) => {
    const colors = VARIANT_COLORS[variant];

    return (
        <View
            style={[
                styles.container,
                sizeStyles[size],
                { backgroundColor: colors.bg },
                style,
            ]}
        >
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text
                style={[
                    styles.text,
                    textSizeStyles[size],
                    { color: colors.text },
                ]}
            >
                {text}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        // SVG icon container: rounded-2xl
        borderRadius: RADIUS.lg,
        gap: 4,
    },
    icon: {
        fontSize: 10,
    },
    text: {
        fontFamily: TYPOGRAPHY.family.bold,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
    },
});

const sizeStyles: Record<BadgeSize, ViewStyle> = StyleSheet.create({
    sm: {
        // SVG icon container: p-3
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    md: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
});

const textSizeStyles = StyleSheet.create({
    sm: { fontSize: TYPOGRAPHY.size.xs },
    md: { fontSize: TYPOGRAPHY.size.sm },
});
