/**
 * Register Screen - Pantalla de registro de nueva cuenta
 * Tema reactivo — usa useThemeStore internamente.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, GlassCard } from '../../src/components/ui';
import { registerWithEmail, loginWithGoogle } from '../../src/services/authService';
import {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateRequired,
} from '../../src/utils/validators';
import { useThemeStore } from '../../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

export default function RegisterScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleRegister = async () => {
        const nameVal = validateRequired(fullName, 'El nombre');
        const emailVal = validateEmail(email);
        const passVal = validatePassword(password);
        const matchVal = validatePasswordMatch(password, confirmPassword);

        const newErrors: FormErrors = {};
        if (!nameVal.isValid) newErrors.fullName = nameVal.error;
        if (!emailVal.isValid) newErrors.email = emailVal.error;
        if (!passVal.isValid) newErrors.password = passVal.error;
        if (!matchVal.isValid) newErrors.confirmPassword = matchVal.error;

        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setErrors({});
        setIsLoading(true);
        const result = await registerWithEmail({
            email: email.trim(), password, fullName: fullName.trim(),
        });
        if (!result.success) setErrors({ general: result.error });
        setIsLoading(false);
    };

    const handleGoogleRegister = async () => {
        setIsGoogleLoading(true);
        setErrors({});
        const result = await loginWithGoogle();
        if (!result.success && result.error !== 'Inicio de sesión cancelado') {
            setErrors({ general: result.error });
        }
        setIsGoogleLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.screen, { backgroundColor: C.background.primary }]}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: C.iconContainer.primary }]}>
                        <Ionicons name="person-add-outline" size={48} color={C.accent.primary} />
                    </View>
                    <Text style={[styles.title, { color: C.text.primary }]}>Crea tu cuenta</Text>
                    <Text style={[styles.subtitle, { color: C.text.tertiary }]}>
                        Comienza a controlar tus finanzas
                    </Text>
                </Animated.View>

                {/* Formulario */}
                <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                    <GlassCard variant="elevated" padding="2xl">
                        {errors.general && (
                            <View style={[styles.errorBanner, { backgroundColor: C.iconContainer.danger }]}>
                                <Text style={[styles.errorBannerText, { color: C.accent.danger }]}>
                                    {errors.general}
                                </Text>
                            </View>
                        )}

                        {/* Google */}
                        <Pressable
                            style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
                            onPress={handleGoogleRegister}
                            disabled={isGoogleLoading}
                        >
                            <Ionicons name="logo-google" size={20} color="#4285F4" />
                            <Text style={styles.googleText}>
                                {isGoogleLoading ? 'Conectando...' : 'Registrarse con Google'}
                            </Text>
                        </Pressable>

                        {/* Separador */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: C.border.primary }]} />
                            <Text style={[styles.dividerText, { color: C.text.tertiary }]}>o con email</Text>
                            <View style={[styles.dividerLine, { backgroundColor: C.border.primary }]} />
                        </View>

                        <Input
                            label="Nombre completo"
                            placeholder="Tu nombre"
                            value={fullName}
                            onChangeText={setFullName}
                            error={errors.fullName}
                            autoCapitalize="words"
                            autoComplete="name"
                            leftIcon={<Ionicons name="person-outline" size={18} color={C.text.tertiary} />}
                        />
                        <Input
                            label="Correo Gmail"
                            placeholder="tu@gmail.com"
                            value={email}
                            onChangeText={setEmail}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            leftIcon={<Ionicons name="mail-outline" size={18} color={C.text.tertiary} />}
                        />
                        <Input
                            label="Contraseña"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChangeText={setPassword}
                            error={errors.password}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={C.text.tertiary} />}
                            rightIcon={
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={18}
                                    color={C.text.tertiary}
                                />
                            }
                            onRightIconPress={() => setShowPassword(!showPassword)}
                        />
                        <Input
                            label="Confirmar contraseña"
                            placeholder="Repite tu contraseña"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            error={errors.confirmPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={C.text.tertiary} />}
                        />

                        <Button
                            title="Crear Cuenta"
                            onPress={handleRegister}
                            loading={isLoading}
                            disabled={isLoading || isGoogleLoading}
                            fullWidth
                            size="lg"
                            style={styles.registerButton}
                        />
                    </GlassCard>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.footer}>
                    <Text style={[styles.footerText, { color: C.text.secondary }]}>¿Ya tienes cuenta? </Text>
                    <Pressable onPress={() => router.back()}>
                        <Text style={[styles.footerLink, { color: C.accent.primary }]}>Inicia sesión</Text>
                    </Pressable>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: {
        flexGrow: 1, justifyContent: 'center',
        paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING['3xl'],
    },
    header: { alignItems: 'center', marginBottom: SPACING['3xl'] },
    iconContainer: {
        width: 88, height: 88, borderRadius: RADIUS['3xl'],
        justifyContent: 'center', alignItems: 'center',
        marginBottom: SPACING.lg, ...SHADOWS.floating,
    },
    title: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size['3xl'], letterSpacing: -0.5,
    },
    subtitle: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md, marginTop: SPACING.xs },
    googleButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.lg, gap: SPACING.md, minHeight: 48, marginBottom: SPACING.xl, ...SHADOWS.lg,
    },
    googleButtonDisabled: { opacity: 0.6 },
    googleText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#1F1F1F' },
    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
    dividerLine: { flex: 1, height: 1 },
    dividerText: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, marginHorizontal: SPACING.md,
    },
    errorBanner: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
    errorBannerText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, textAlign: 'center' },
    registerButton: { marginTop: SPACING.sm },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING['2xl'] },
    footerText: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md },
    footerLink: { fontFamily: TYPOGRAPHY.family.semibold, fontSize: TYPOGRAPHY.size.md },
});
