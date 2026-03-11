/**
 * EditProfileScreen — Editar nombre y datos del perfil
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    TextInput, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { supabase } from '../src/services/supabase';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../src/constants/theme';
import { GlassCard } from '../src/components/ui';
import { safeGoBack } from '../src/utils/navigation';

export default function EditProfileScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);
    const { profile, user, fetchProfile } = useAuthStore();

    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'El nombre no puede estar vacío');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ full_name: fullName.trim() })
                .eq('user_id', user?.id);

            if (error) throw error;

            // Recargar perfil en el store
            await fetchProfile();
            Alert.alert('✅ Perfil actualizado', 'Tu nombre se guardó correctamente.');
            router.back();
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No se pudo actualizar');
        } finally {
            setSaving(false);
        }
    };

    const initial = fullName?.charAt(0)?.toUpperCase() ?? '?';

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => safeGoBack(router)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <Text style={[styles.title, { color: C.text.primary }]}>Editar Perfil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatar, { backgroundColor: C.accent.primary }]}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                </View>

                {/* Nombre */}
                <GlassCard variant="elevated" padding="lg">
                    <Text style={[styles.label, { color: C.text.tertiary }]}>NOMBRE COMPLETO</Text>
                    <TextInput
                        style={[styles.input, {
                            color: C.text.primary,
                            backgroundColor: C.background.tertiary,
                            borderColor: C.border.secondary,
                        }]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Tu nombre completo"
                        placeholderTextColor={C.text.tertiary}
                        autoCapitalize="words"
                    />

                    <Text style={[styles.label, { color: C.text.tertiary, marginTop: SPACING.lg }]}>
                        CORREO ELECTRÓNICO
                    </Text>
                    <View style={[styles.readOnlyField, { backgroundColor: C.background.tertiary }]}>
                        <Ionicons name="mail-outline" size={18} color={C.text.tertiary} />
                        <Text style={[styles.readOnlyText, { color: C.text.secondary }]}>
                            {user?.email ?? '—'}
                        </Text>
                        <Ionicons name="lock-closed-outline" size={14} color={C.text.tertiary} />
                    </View>
                    <Text style={[styles.hint, { color: C.text.tertiary }]}>
                        El correo no se puede cambiar
                    </Text>
                </GlassCard>

                {/* Botón guardar */}
                <Pressable
                    style={[styles.saveBtn, { backgroundColor: C.accent.primary, opacity: saving ? 0.6 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: SPACING['4xl'], paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    },
    backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
    title: { fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xl },
    content: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING['3xl'] },
    avatarSection: { alignItems: 'center', marginBottom: SPACING.xl },
    avatar: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: 32, color: '#FFF',
    },
    label: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.xs,
        letterSpacing: 1.5, textTransform: 'uppercase',
        marginBottom: SPACING.sm,
    },
    input: {
        fontFamily: TYPOGRAPHY.family.medium, fontSize: TYPOGRAPHY.size.md,
        borderRadius: RADIUS.lg, borderWidth: 1,
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    },
    readOnlyField: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    },
    readOnlyText: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.md, flex: 1,
    },
    hint: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs,
        marginTop: SPACING.xs,
    },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: SPACING.sm, borderRadius: RADIUS.lg,
        paddingVertical: SPACING.lg, marginTop: SPACING.xl,
    },
    saveBtnText: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md, color: '#FFF',
    },
});
