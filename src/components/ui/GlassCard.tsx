/**
 * GlassCard - Componente base con efecto glassmorphism
 * Tarjeta con fondo semitransparente y borde luminoso.
 * Se suscribe internamente al themeStore → reacciona al tema sin necesitar prop isDark.
 */
import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    Pressable,
    PressableProps,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { getThemeColors, RADIUS, SPACING, SHADOWS, ANIMATION } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    style?: ViewStyle;
    /** Variante de estilo */
    variant?: 'default' | 'elevated' | 'accent';
    /** Padding interno */
    padding?: keyof typeof SPACING;
    /** Si la tarjeta es presionable con animación */
    pressable?: boolean;
}

/**
 * Tarjeta con efecto glass — tema reactivo vía useThemeStore.
 * No requiere prop isDark; se auto-suscribe al store global.
 * Incluye micro-animación de escala al presionar.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 'lg',
    pressable = false,
    ...props
}) => {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (pressable) scale.value = withSpring(0.97, ANIMATION.spring.stiff);
    };

    const handlePressOut = () => {
        if (pressable) scale.value = withSpring(1, ANIMATION.spring.gentle);
    };

    /** Colores por variante — calculados en render para reaccionar al tema */
    const variantStyle: ViewStyle = (() => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: C.background.elevated,
                    borderColor: C.border.primary,
                    ...SHADOWS.lg,
                };
            case 'accent':
                return {
                    backgroundColor: C.glass.background,
                    borderColor: C.border.accent,
                    ...SHADOWS.floating,
                };
            default: // 'default'
                return {
                    backgroundColor: C.glass.background,
                    borderColor: C.glass.border,
                    ...SHADOWS.sm,
                };
        }
    })();

    const containerStyle = [
        styles.container,
        variantStyle,
        { padding: SPACING[padding] },
        style,
    ];

    return (
        <AnimatedPressable
            style={[animatedStyle, ...containerStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!pressable && !props.onPress}
            {...props}
        >
            {/* Borde luminoso superior */}
            <View style={[styles.highlightBorder, { backgroundColor: C.glass.highlight }]} />
            {children}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS['3xl'],
        overflow: 'hidden',
        borderWidth: 1,
        position: 'relative',
    },
    highlightBorder: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        height: 1,
    },
});
