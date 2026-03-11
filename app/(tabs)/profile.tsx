/**
 * Profile Screen — Perfil y configuración
 * SmartWallet UI: Ionicons, labels uppercase tracking-widest, squircle geometry
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { GlassCard, Button } from '../../src/components/ui';
import { getFirstName } from '../../src/utils/formatters';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function ProfileScreen() {
    const { user, profile, signOut } = useAuthStore();
    const { isDark, toggle } = useThemeStore();
    const C = getThemeColors(isDark);
    const router = useRouter();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    /** Ejecuta el cierre de sesión */
    const executeSignOut = async () => {
        setShowLogoutModal(false);
        await signOut();
        router.replace('/(auth)/login');
    };

    /** Confirma y cierra sesión */
    const handleSignOut = () => {
        if (Platform.OS === 'web') {
            // En web usamos un modal custom en vez de window.confirm
            setShowLogoutModal(true);
        } else {
            Alert.alert(
                'Cerrar Sesión',
                '¿Estás seguro de que quieres cerrar sesión?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Cerrar Sesión',
                        style: 'destructive',
                        onPress: executeSignOut,
                    },
                ]
            );
        }
    };

    const displayName = profile?.full_name ?? user?.email ?? 'Usuario';
    const displayEmail = user?.email ?? '';
    const initial = getFirstName(displayName).charAt(0).toUpperCase();

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header del perfil ── */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: C.text.primary }]}>Perfil</Text>
                </View>

                {/* ── Avatar y nombre ── */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatar, { backgroundColor: C.accent.primary }]}>
                        <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>{initial}</Text>
                    </View>
                    <Text style={[styles.userName, { color: C.text.primary }]}>{displayName}</Text>
                    <Text style={[styles.userEmail, { color: C.text.tertiary }]}>{displayEmail}</Text>
                </View>

                {/* ── Sección de cuenta ── */}
                <Text style={[styles.sectionLabel, { color: C.text.tertiary }]}>Cuenta</Text>
                <GlassCard variant="elevated" padding="md">
                    <ProfileRow iconName="person-outline" label="Editar perfil" isDark={isDark} onPress={() => router.push('/edit-profile' as any)} />
                    <ProfileRow iconName="notifications-outline" label="Notificaciones" isDark={isDark} onPress={() => router.push('/notifications' as any)} />
                    <ProfileRow iconName="cash-outline" label="Moneda" value="MXN" isDark={isDark} />
                    <ProfileRow
                        iconName={isDark ? 'moon-outline' : 'sunny-outline'}
                        label="Tema"
                        value={isDark ? 'Oscuro' : 'Claro'}
                        isDark={isDark}
                        isLast
                        onPress={toggle}
                    />
                </GlassCard>

                {/* ── Sección de análisis ── */}
                <Text style={[styles.sectionLabel, { color: C.text.tertiary }]}>Análisis</Text>
                <GlassCard variant="elevated" padding="md">
                    <ProfileRow
                        iconName="bar-chart-outline"
                        label="Reportes"
                        isDark={isDark}
                        onPress={() => router.push('/reports' as any)}
                    />
                    <ProfileRow
                        iconName="trending-up-outline"
                        label="Historial mensual"
                        isDark={isDark}
                        onPress={() => router.push('/history' as any)}
                        isLast
                    />
                </GlassCard>

                {/* ── Sección de info ── */}
                <Text style={[styles.sectionLabel, { color: C.text.tertiary }]}>Información</Text>
                <GlassCard variant="elevated" padding="md">
                    <ProfileRow iconName="document-text-outline" label="Términos de uso" isDark={isDark} onPress={() => router.push('/terms' as any)} />
                    <ProfileRow iconName="shield-checkmark-outline" label="Política de privacidad" isDark={isDark} onPress={() => router.push('/privacy' as any)} />
                    <ProfileRow iconName="phone-portrait-outline" label="Versión" value="1.0.0" isDark={isDark} isLast />
                </GlassCard>

                {/* ── Botón de cerrar sesión ── */}
                <Button
                    title="Cerrar Sesión"
                    onPress={handleSignOut}
                    variant="danger"
                    fullWidth
                    size="lg"
                    style={styles.signOutButton}
                />
            </ScrollView>

            {/* ── Modal de confirmación de cierre de sesión ── */}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalOverlayTouchable} onPress={() => setShowLogoutModal(false)} />
                    <View style={[styles.modalContainer, { backgroundColor: C.background.card }]}>
                        <View style={[styles.modalIconCircle, { backgroundColor: C.iconContainer.danger }]}>
                            <Ionicons name="log-out-outline" size={32} color={C.accent.danger} />
                        </View>
                        <Text style={[styles.modalTitle, { color: C.text.primary }]}>Cerrar Sesión</Text>
                        <Text style={[styles.modalMessage, { color: C.text.secondary }]}>
                            ¿Estás seguro de que quieres cerrar sesión? Tendrás que iniciar sesión de nuevo para acceder.
                        </Text>
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: C.border.primary }]}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: C.text.primary }]}>Cancelar</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalBtn, styles.modalBtnDanger, { backgroundColor: C.accent.danger }]}
                                onPress={executeSignOut}
                            >
                                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Cerrar Sesión</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ── Componente auxiliar: fila de perfil con Ionicons ──

interface ProfileRowProps {
    iconName: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    isDark: boolean;
    isLast?: boolean;
    onPress?: () => void;
}

function ProfileRow({ iconName, label, value, isDark, isLast = false, onPress }: ProfileRowProps) {
    const C = getThemeColors(isDark);
    return (
        <Pressable
            onPress={onPress}
            style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: C.border.secondary }]}
        >
            <View style={styles.rowLeft}>
                <View style={[styles.rowIconContainer, { backgroundColor: C.iconContainer.primary }]}>
                    <Ionicons name={iconName} size={18} color={C.iconContainer.primaryText} />
                </View>
                <Text style={[styles.rowLabel, { color: C.text.primary }]}>{label}</Text>
            </View>
            <View style={styles.rowRight}>
                {value && <Text style={[styles.rowValue, { color: C.text.tertiary }]}>{value}</Text>}
                <Ionicons name="chevron-forward" size={16} color={C.text.tertiary} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['4xl'],
    },
    // ── Header ──
    header: {
        paddingTop: SPACING['5xl'],
        paddingBottom: SPACING.lg,
    },
    title: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['2xl'],
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    // ── Avatar ──
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: RADIUS['3xl'],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.floating,
    },
    avatarText: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size['3xl'],
    },
    userName: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    },
    userEmail: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
        marginTop: 4,
    },
    // ── Section ──
    sectionLabel: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: TYPOGRAPHY.letterSpacing.widest,
        textTransform: 'uppercase',
        marginBottom: SPACING.sm,
        marginTop: SPACING.xl,
        marginLeft: SPACING.xs,
    },
    // ── Row ──
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    rowIconContainer: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowLabel: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.md,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    rowValue: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.sm,
    },
    // ── Sign out ──
    signOutButton: {
        marginTop: SPACING['3xl'],
    },
    // ── Logout Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlayTouchable: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    modalContainer: {
        width: '85%',
        maxWidth: 380,
        borderRadius: RADIUS['2xl'],
        padding: SPACING['2xl'],
        alignItems: 'center',
        ...SHADOWS.floating,
    },
    modalIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.xl,
        marginBottom: SPACING.sm,
    },
    modalMessage: {
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.sm,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.xl,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    modalBtnCancel: {
        borderWidth: 1.5,
    },
    modalBtnDanger: {},
    modalBtnText: {
        fontFamily: TYPOGRAPHY.family.bold,
        fontSize: TYPOGRAPHY.size.md,
    },
});
