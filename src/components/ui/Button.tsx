/**
 * Button - Componente de botón premium
 * Soporta variantes, tamaños, estados de carga y animaciones.
 * Los colores que dependen del tema usan el themeStore internamente.
 */
import React from 'react';
import {
    StyleSheet,
    Text,
    ActivityIndicator,
    Pressable,
    ViewStyle,
    TextStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATION } from '../../constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    fullWidth = false,
    style,
}) => {
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, ANIMATION.spring.stiff);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, ANIMATION.spring.gentle);
    };

    const handlePress = () => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const isDisabled = disabled || loading;

    /** Estilo del contenedor según variante — reactivo al tema */
    const variantContainerStyle: ViewStyle = (() => {
        switch (variant) {
            case 'primary': return { backgroundColor: C.accent.primary, ...SHADOWS.floating };
            case 'secondary': return { backgroundColor: C.background.elevated };
            case 'outline': return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.accent.primary };
            case 'ghost': return { backgroundColor: 'transparent' };
            case 'danger': return { backgroundColor: C.accent.danger };
        }
    })();

    /** Color del texto según variante */
    const textColor = (() => {
        switch (variant) {
            case 'outline':
            case 'ghost': return C.accent.primary;
            default: return '#FFFFFF';
        }
    })();

    return (
        <AnimatedPressable
            style={[
                animatedStyle,
                styles.base,
                sizeStyles[size],
                variantContainerStyle,
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={isDisabled}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost'
                        ? C.accent.primary
                        : '#FFFFFF'}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text style={[
                        styles.text,
                        textSizeStyles[size],
                        { color: textColor },
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </AnimatedPressable>
    );
};

// ── Estilos fijos (layout / tamaños) ──
const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        borderRadius: RADIUS.lg,
    },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.5 },
    text: {
        fontFamily: TYPOGRAPHY.family.bold,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = StyleSheet.create({
    sm: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, minHeight: 40 },
    md: { paddingVertical: SPACING.md, paddingHorizontal: SPACING['2xl'], minHeight: 48 },
    lg: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING['3xl'], minHeight: 56 },
});

const textSizeStyles: Record<ButtonSize, TextStyle> = StyleSheet.create({
    sm: { fontSize: TYPOGRAPHY.size.sm },
    md: { fontSize: TYPOGRAPHY.size.md },
    lg: { fontSize: TYPOGRAPHY.size.lg },
});
