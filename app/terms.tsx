/**
 * TermsScreen — Términos de uso de FinanzApp
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../src/store/themeStore';
import { getThemeColors, TYPOGRAPHY, SPACING, RADIUS } from '../src/constants/theme';
import { safeGoBack } from '../src/utils/navigation';

export default function TermsScreen() {
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
                <Text style={[styles.title, { color: C.text.primary }]}>Términos de Uso</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.updated, { color: C.text.tertiary }]}>
                    Última actualización: 10 de marzo de 2026
                </Text>

                <Section title="1. Aceptación de los Términos" color={C.text.primary} subColor={C.text.secondary}>
                    Al acceder y utilizar FinanzApp, aceptas estos términos de uso en su totalidad.
                    Si no estás de acuerdo con alguno de estos términos, te pedimos no utilizar la aplicación.
                </Section>

                <Section title="2. Descripción del Servicio" color={C.text.primary} subColor={C.text.secondary}>
                    FinanzApp es una herramienta de gestión financiera personal que permite a los usuarios
                    registrar y monitorear sus tarjetas de crédito, gastos, presupuestos y metas de ahorro.
                    La aplicación no realiza transacciones financieras ni tiene acceso a tus cuentas bancarias.
                </Section>

                <Section title="3. Registro y Cuenta" color={C.text.primary} subColor={C.text.secondary}>
                    Para utilizar FinanzApp necesitas crear una cuenta proporcionando información veraz.
                    Eres responsable de mantener la confidencialidad de tu contraseña y de todas las
                    actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente sobre
                    cualquier uso no autorizado.
                </Section>

                <Section title="4. Uso Aceptable" color={C.text.primary} subColor={C.text.secondary}>
                    Te comprometes a utilizar FinanzApp únicamente para fines legales y de acuerdo con
                    estos términos. Queda prohibido: {'\n'}
                    • Usar la app para actividades ilegales {'\n'}
                    • Intentar acceder a cuentas de otros usuarios {'\n'}
                    • Interferir con el funcionamiento de la aplicación {'\n'}
                    • Reproducir o distribuir el contenido sin autorización
                </Section>

                <Section title="5. Datos Financieros" color={C.text.primary} subColor={C.text.secondary}>
                    La información financiera que ingreses en FinanzApp es proporcionada voluntariamente
                    por ti. La aplicación no se conecta directamente a instituciones bancarias. Los datos
                    mostrados son informativos y no constituyen asesoría financiera profesional.
                </Section>

                <Section title="6. Propiedad Intelectual" color={C.text.primary} subColor={C.text.secondary}>
                    Todo el contenido de FinanzApp, incluyendo diseño, código, gráficos y textos,
                    es propiedad de sus desarrolladores y está protegido por leyes de propiedad intelectual.
                </Section>

                <Section title="7. Limitación de Responsabilidad" color={C.text.primary} subColor={C.text.secondary}>
                    FinanzApp se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos
                    responsables por decisiones financieras tomadas con base en la información mostrada
                    en la aplicación, ni por pérdida de datos o interrupciones del servicio.
                </Section>

                <Section title="8. Modificaciones" color={C.text.primary} subColor={C.text.secondary}>
                    Nos reservamos el derecho de modificar estos términos en cualquier momento.
                    Los cambios serán efectivos al publicarse en la aplicación. El uso continuado
                    después de los cambios constituye la aceptación de los nuevos términos.
                </Section>

                <Section title="9. Contacto" color={C.text.primary} subColor={C.text.secondary}>
                    Si tienes preguntas sobre estos términos, puedes contactarnos a través de la
                    sección de soporte dentro de la aplicación.
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
