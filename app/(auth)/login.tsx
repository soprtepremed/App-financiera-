/**
 * Login Screen - Pantalla de inicio de sesión
 * Diseño premium dark con Google OAuth como método principal
 * y opción secundaria de email/password. Tema reactivo.
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
import { loginWithEmail, loginWithGoogle } from '../../src/services/authService';
import { validateEmail, validatePassword } from '../../src/utils/validators';
import { useThemeStore } from '../../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function LoginScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleEmailLogin = async () => {
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        if (!emailValidation.isValid || !passwordValidation.isValid) {
            setErrors({ email: emailValidation.error, password: passwordValidation.error });
            return;
        }
        setErrors({});
        setIsLoading(true);
        const result = await loginWithEmail({ email: email.trim(), password });
        if (!result.success) setErrors({ general: result.error });
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
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
                {/* Logo y título */}
                <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: C.iconContainer.primary }]}>
                        <Ionicons name="wallet" size={48} color={C.accent.primary} />
                    </View>
                    <Text style={[styles.logoText, { color: C.text.primary }]}>FinanzApp</Text>
                    <Text style={[styles.subtitle, { color: C.text.tertiary }]}>
                        Tu control financiero personal
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
                            onPress={handleGoogleLogin}
                            disabled={isGoogleLoading}
                        >
                            <Ionicons name="logo-google" size={20} color="#4285F4" />
                            <Text style={styles.googleText}>
                                {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
                            </Text>
                        </Pressable>

                        {/* Separador */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: C.border.primary }]} />
                            <Text style={[styles.dividerText, { color: C.text.tertiary }]}>o con email</Text>
                            <View style={[styles.dividerLine, { backgroundColor: C.border.primary }]} />
                        </View>

                        <Input
                            label="Correo electrónico"
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
                            placeholder="••••••"
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
                        <Button
                            title="Iniciar Sesión"
                            onPress={handleEmailLogin}
                            loading={isLoading}
                            disabled={isLoading || isGoogleLoading}
                            fullWidth
                            size="lg"
                            style={styles.loginButton}
                        />
                    </GlassCard>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.footer}>
                    <Text style={[styles.footerText, { color: C.text.secondary }]}>¿No tienes cuenta? </Text>
                    <Pressable onPress={() => router.push('/(auth)/register')}>
                        <Text style={[styles.footerLink, { color: C.accent.primary }]}>Regístrate</Text>
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
        paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING['4xl'],
    },
    header: { alignItems: 'center', marginBottom: SPACING['4xl'] },
    logoContainer: {
        width: 88, height: 88, borderRadius: RADIUS['3xl'],
        justifyContent: 'center', alignItems: 'center',
        marginBottom: SPACING.lg, ...SHADOWS.floating,
    },
    logoText: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.hero,
        letterSpacing: TYPOGRAPHY.letterSpacing.tighter,
    },
    subtitle: { fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md, marginTop: SPACING.xs },
    googleButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFFFFF', paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl, borderRadius: RADIUS.lg,
        gap: SPACING.md, minHeight: 52, marginBottom: SPACING.xl, ...SHADOWS.lg,
    },
    googleButtonDisabled: { opacity: 0.6 },
    googleText: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#1F1F1F' },
    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
    dividerLine: { flex: 1, height: 1 },
    dividerText: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm, marginHorizontal: SPACING.md,
    },
    errorBanner: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
    errorBannerText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.sm, textAlign: 'center' },
    loginButton: { marginTop: SPACING.sm },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING['2xl'] },
    footerText: { fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md },
    footerLink: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md },
});
