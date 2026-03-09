/**
 * Auth Store - FinanzApp
 * Estado global de autenticación con Zustand
 * Maneja sesión, usuario y estado de carga
 */
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { UserProfile } from '../types/database';

interface AuthState {
    /** Sesión actual de Supabase */
    session: Session | null;
    /** Usuario autenticado */
    user: User | null;
    /** Perfil del usuario desde nuestra tabla */
    profile: UserProfile | null;
    /** Estado de carga inicial */
    isLoading: boolean;
    /** Si ya se completó la verificación de sesión */
    isInitialized: boolean;

    // ── Acciones ──
    setSession: (session: Session | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
}

/**
 * Store de autenticación
 * Se inicializa al montar el layout principal
 */
export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isInitialized: false,

    setSession: (session) => {
        set({
            session,
            user: session?.user ?? null,
        });
    },

    setProfile: (profile) => {
        set({ profile });
    },

    /**
     * Inicializa la sesión verificando si hay una sesión activa
     * y configurando el listener de cambios de auth
     */
    initialize: async () => {
        try {
            // Obtener sesión actual
            const { data: { session } } = await supabase.auth.getSession();
            set({
                session,
                user: session?.user ?? null,
                isInitialized: true,
                isLoading: false,
            });

            // Si hay sesión, cargar perfil
            if (session?.user) {
                await get().fetchProfile();
            }

            // Listener de cambios en auth (login, logout, refresh)
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    session,
                    user: session?.user ?? null,
                });

                if (session?.user) {
                    get().fetchProfile();
                } else {
                    set({ profile: null });
                }
            });
        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ isLoading: false, isInitialized: true });
        }
    },

    /** Obtiene el perfil del usuario autenticado */
    fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            set({ profile: data as UserProfile });
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    },

    /** Cierra sesión y limpia el estado */
    signOut: async () => {
        try {
            await supabase.auth.signOut();
            set({
                session: null,
                user: null,
                profile: null,
            });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    },
}));
