/**
 * AuthService - Servicio de autenticación
 * Maneja registro, login con email, y Google OAuth
 * Usa Supabase Auth con auto-confirmación para pruebas
 */
import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

// ── Tipos ──

interface RegisterParams {
    email: string;
    password: string;
    fullName: string;
}

interface LoginParams {
    email: string;
    password: string;
}

interface AuthResult {
    success: boolean;
    error?: string;
}

// ── Registro con email + nombre ──

/**
 * Registra un nuevo usuario con email y contraseña.
 * Después de registrarse, crea automáticamente su perfil
 * con el nombre completo en la tabla user_profiles.
 */
export async function registerWithEmail({
    email,
    password,
    fullName,
}: RegisterParams): Promise<AuthResult> {
    try {
        // 1. Crear usuario en Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;

        // 2. Si el usuario se creó correctamente, crear perfil
        if (data.user) {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    user_id: data.user.id,
                    full_name: fullName,
                    currency: 'MXN',
                    timezone: 'America/Mexico_City',
                    onboarding_completed: false,
                    onboarding_step: 0,
                    notification_preferences: {
                        payment_reminders: true,
                        cutoff_alerts: true,
                        budget_alerts: true,
                        savings_reminders: true,
                        weekly_summary: true,
                        days_before_payment: 5,
                        days_before_cutoff: 3,
                    },
                });

            if (profileError) {
                console.warn('Error creando perfil (se reintentará):', profileError.message);
            }
        }

        return { success: true };
    } catch (error: any) {
        // Mensajes de error en español para mejor UX
        const message = translateAuthError(error.message);
        return { success: false, error: message };
    }
}

// ── Login con email ──

/**
 * Inicia sesión con email y contraseña.
 * El listener global en authStore maneja la actualización del estado.
 */
export async function loginWithEmail({
    email,
    password,
}: LoginParams): Promise<AuthResult> {
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        const message = translateAuthError(error.message);
        return { success: false, error: message };
    }
}

// ── Google OAuth ──

/**
 * Inicia el flujo de autenticación con Google.
 * En WEB: usa redirect directo (window.location).
 * En NATIVO: usa WebBrowser + extrae tokens del hash fragment.
 */
export async function loginWithGoogle(): Promise<AuthResult> {
    try {
        // ── WEB: Redirect directo ──
        if (Platform.OS === 'web') {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { prompt: 'select_account' },
                },
            });

            if (error) throw error;

            // En web, Supabase redirige automáticamente al URL de Google
            // El callback vuelve a nuestra app y el onAuthStateChange
            // del authStore detecta la sesión.
            if (data?.url) {
                window.location.href = data.url;
            }

            return { success: true };
        }

        // ── NATIVO: WebBrowser ──
        const redirectTo = makeRedirectUri({
            scheme: 'finanzapp',
            path: 'auth/callback',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: { prompt: 'select_account' },
            },
        });

        if (error) throw error;

        if (data?.url) {
            // Abrir navegador del sistema
            const result = await WebBrowser.openAuthSessionAsync(
                data.url,
                redirectTo
            );

            if (result.type === 'success' && result.url) {
                // Supabase devuelve tokens en HASH FRAGMENTS (#), no query params (?)
                // Ejemplo: ...#access_token=xxx&refresh_token=yyy
                const hashParams = result.url.split('#')[1];
                if (hashParams) {
                    const params = new URLSearchParams(hashParams);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (sessionError) throw sessionError;
                        return { success: true };
                    }
                }

                // Fallback: intentar con query params también
                const url = new URL(result.url);
                const accessToken = url.searchParams.get('access_token');
                const refreshToken = url.searchParams.get('refresh_token');
                if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) throw sessionError;
                    return { success: true };
                }
            } else if (result.type === 'cancel') {
                return { success: false, error: 'Inicio de sesión cancelado' };
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Google OAuth error:', error);
        return {
            success: false,
            error: 'Error al iniciar sesión con Google. Intenta de nuevo.',
        };
    }
}

// ── Cerrar sesión ──

export async function signOut(): Promise<void> {
    await supabase.auth.signOut();
}

// ── Helpers ──

/**
 * Traduce los mensajes de error de Supabase Auth al español.
 * Mejora la UX al mostrar mensajes comprensibles.
 */
function translateAuthError(message: string): string {
    const errorMap: Record<string, string> = {
        'Invalid login credentials': 'Email o contraseña incorrectos',
        'Email not confirmed': 'Confirma tu email antes de iniciar sesión',
        'User already registered': 'Este email ya está registrado',
        'Password should be at least 6 characters':
            'La contraseña debe tener al menos 6 caracteres',
        'Email rate limit exceeded':
            'Demasiados intentos. Espera unos minutos.',
        'Signup requires a valid password':
            'Ingresa una contraseña válida',
    };

    // Buscar coincidencia parcial si no hay exacta
    for (const [key, value] of Object.entries(errorMap)) {
        if (message.includes(key)) return value;
    }

    return message;
}
