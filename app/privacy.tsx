/**
 * PrivacyScreen — Política de Privacidad de FinanzApp
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING } from '../src/constants/theme';
import { safeGoBack } from '../src/utils/navigation';

export default function PrivacyScreen() {
    const router = useRouter();
    const { isDark } = useThemeStore();
    const C = getThemeColors(isDark);

    return (
        <View style={[styles.screen, { backgroundColor: C.background.primary }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={styles.header}>
                <Pressable onPress={() => safeGoBack(router)} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text.primary} />
                </Pressable>
                <Text style={[styles.title, { color: C.text.primary }]}>Política de Privacidad</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.updated, { color: C.text.tertiary }]}>
                    Última actualización: 10 de marzo de 2026
                </Text>

                <Section title="1. Información que Recopilamos" color={C.text.primary} subColor={C.text.secondary}>
                    FinanzApp recopila la siguiente información: {'\n'}
                    • Datos de registro: nombre, correo electrónico {'\n'}
                    • Datos financieros ingresados voluntariamente: tarjetas, gastos, presupuestos y metas {'\n'}
                    • Datos técnicos: tipo de dispositivo, sistema operativo, para mejorar la experiencia
                </Section>

                <Section title="2. Cómo Usamos tu Información" color={C.text.primary} subColor={C.text.secondary}>
                    Utilizamos tu información exclusivamente para: {'\n'}
                    • Proporcionarte el servicio de gestión financiera personal {'\n'}
                    • Generar reportes y análisis de tus finanzas {'\n'}
                    • Enviarte recordatorios de pago (si activas notificaciones) {'\n'}
                    • Mejorar la funcionalidad y experiencia de la aplicación
                </Section>

                <Section title="3. Almacenamiento y Seguridad" color={C.text.primary} subColor={C.text.secondary}>
                    Tus datos se almacenan de forma segura en servidores de Supabase con cifrado
                    en tránsito (TLS/SSL) y en reposo. Implementamos Row Level Security (RLS) para
                    garantizar que solo tú puedas acceder a tu información financiera.
                    Ningún otro usuario ni administrador puede ver tus datos personales.
                </Section>

                <Section title="4. Compartición de Datos" color={C.text.primary} subColor={C.text.secondary}>
                    No vendemos, alquilamos ni compartimos tu información personal con terceros.
                    Tus datos financieros son completamente privados. Solo compartimos información
                    cuando es requerido por ley o para proteger nuestros derechos legales.
                </Section>

                <Section title="5. Autenticación con Google" color={C.text.primary} subColor={C.text.secondary}>
                    Si inicias sesión con Google, solo accedemos a tu nombre y correo electrónico
                    para crear tu cuenta. No accedemos a tus contactos, archivos, calendario ni
                    ningún otro dato de tu cuenta de Google.
                </Section>

                <Section title="6. Retención de Datos" color={C.text.primary} subColor={C.text.secondary}>
                    Mantenemos tus datos mientras tengas una cuenta activa. Si deseas eliminar tu
                    cuenta y todos los datos asociados, puedes solicitarlo contactándonos directamente.
                    Los datos serán eliminados de forma permanente dentro de los 30 días siguientes.
                </Section>

                <Section title="7. Tus Derechos" color={C.text.primary} subColor={C.text.secondary}>
                    De acuerdo con las leyes aplicables, tienes derecho a: {'\n'}
                    • Acceder a tus datos personales {'\n'}
                    • Rectificar información incorrecta {'\n'}
                    • Solicitar la eliminación de tus datos {'\n'}
                    • Exportar tus datos en un formato legible {'\n'}
                    • Revocar tu consentimiento en cualquier momento
                </Section>

                <Section title="8. Cookies y Tecnologías" color={C.text.primary} subColor={C.text.secondary}>
                    En la versión web, utilizamos almacenamiento local (localStorage) para mantener
                    tu sesión y preferencias de tema. No utilizamos cookies de rastreo ni
                    herramientas de análisis de terceros.
                </Section>

                <Section title="9. Cambios a esta Política" color={C.text.primary} subColor={C.text.secondary}>
                    Podemos actualizar esta política de privacidad periódicamente. Te notificaremos
                    sobre cambios significativos a través de la aplicación. Te recomendamos revisar
                    esta política regularmente.
                </Section>

                <Section title="10. Contacto" color={C.text.primary} subColor={C.text.secondary}>
                    Para ejercer tus derechos o resolver dudas sobre privacidad, contáctanos
                    a través de la sección de soporte de la aplicación.
                </Section>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

function Section({ title, children, color, subColor }: {
    title: string; children: React.ReactNode; color: string; subColor: string;
}) {
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
            <Text style={[styles.sectionBody, { color: subColor }]}>{children}</Text>
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
    content: { paddingHorizontal: SPACING.xl },
    updated: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.xs,
        marginBottom: SPACING.lg,
    },
    section: { marginBottom: SPACING.lg },
    sectionTitle: {
        fontFamily: TYPOGRAPHY.family.bold, fontSize: TYPOGRAPHY.size.md,
        marginBottom: SPACING.sm,
    },
    sectionBody: {
        fontFamily: TYPOGRAPHY.family.regular, fontSize: TYPOGRAPHY.size.sm,
        lineHeight: 22,
    },
});
