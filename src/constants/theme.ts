/**
 * Design Tokens - FinanzApp (SmartWallet UI)
 * Sistema de diseño centralizado basado en la spec SmartWallet UI
 * Colores Slate/Indigo, geometría Squircle, tipografía premium
 */

/**
 * Paleta OSCURA (por defecto) — Slate/Indigo
 * Exportamos también como COLORS para compatibilidad con el código existente.
 */
export const DARK_COLORS = {
    background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
        card: '#1e293b',
        elevated: '#283548',
    },
    accent: {
        primary: '#6366F1',
        secondary: '#4F46E5',
        tertiary: '#818CF8',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
    },
    gradient: {
        primary: ['#6366F1', '#4F46E5'] as const,
        success: ['#10B981', '#059669'] as const,
        warning: ['#F59E0B', '#D97706'] as const,
        danger: ['#EF4444', '#DC2626'] as const,
        card: ['#1e293b', '#283548'] as const,
        premium: ['#6366F1', '#818CF8', '#A78BFA'] as const,
    },
    text: {
        primary: '#FFFFFF',
        secondary: '#94A3B8',
        tertiary: '#64748B',
        inverse: '#0f172a',
        accent: '#818CF8',
    },
    border: {
        primary: '#334155',
        secondary: '#1e293b',
        accent: 'rgba(99,102,241,0.2)',
    },
    glass: {
        background: 'rgba(15, 23, 42, 0.80)',
        border: 'rgba(99, 102, 241, 0.15)',
        highlight: 'rgba(255, 255, 255, 0.05)',
    },
    banks: {
        bbva: '#004481', banamex: '#006CB8', santander: '#EC0000',
        hsbc: '#DB0011', banorte: '#CB0C2B', scotiabank: '#EC1A2D',
        azteca: '#00583F', inbursa: '#003366', liverpool: '#D4006A',
    },
    iconContainer: {
        primary: 'rgba(99, 102, 241, 0.10)',
        primaryText: '#818CF8',
        success: 'rgba(16, 185, 129, 0.10)',
        successText: '#34D399',
        warning: 'rgba(245, 158, 11, 0.10)',
        warningText: '#FBBF24',
        danger: 'rgba(239, 68, 68, 0.10)',
        dangerText: '#FB7185',
    },
} as const;

/**
 * Paleta CLARA — White/Slate para modo diurno
 */
export const LIGHT_COLORS = {
    background: {
        primary: '#F8FAFC',    // slate-50
        secondary: '#FFFFFF',   // blanco puro
        tertiary: '#F1F5F9',    // slate-100
        card: '#FFFFFF',
        elevated: '#F8FAFC',
    },
    accent: {
        primary: '#6366F1',    // mismo indigo — identidad de marca
        secondary: '#4F46E5',
        tertiary: '#818CF8',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
    },
    gradient: {
        primary: ['#6366F1', '#4F46E5'] as const,
        success: ['#10B981', '#059669'] as const,
        warning: ['#F59E0B', '#D97706'] as const,
        danger: ['#EF4444', '#DC2626'] as const,
        card: ['#FFFFFF', '#F1F5F9'] as const,
        premium: ['#6366F1', '#818CF8', '#A78BFA'] as const,
    },
    text: {
        primary: '#0F172A',    // slate-900
        secondary: '#475569',  // slate-600
        tertiary: '#94A3B8',   // slate-400
        inverse: '#FFFFFF',
        accent: '#4F46E5',     // indigo-600
    },
    border: {
        primary: '#E2E8F0',    // slate-200
        secondary: '#F1F5F9',  // slate-100
        accent: 'rgba(99,102,241,0.2)',
    },
    glass: {
        background: 'rgba(255, 255, 255, 0.85)',
        border: 'rgba(99, 102, 241, 0.15)',
        highlight: 'rgba(255, 255, 255, 0.70)',
    },
    banks: {
        bbva: '#004481', banamex: '#006CB8', santander: '#EC0000',
        hsbc: '#DB0011', banorte: '#CB0C2B', scotiabank: '#EC1A2D',
        azteca: '#00583F', inbursa: '#003366', liverpool: '#D4006A',
    },
    iconContainer: {
        primary: 'rgba(99, 102, 241, 0.10)',
        primaryText: '#4F46E5',
        success: 'rgba(16, 185, 129, 0.10)',
        successText: '#059669',
        warning: 'rgba(245, 158, 11, 0.10)',
        warningText: '#D97706',
        danger: 'rgba(239, 68, 68, 0.10)',
        dangerText: '#DC2626',
    },
} as const;

/** Alias de compatibilidad — el código existente sigue funcionando */
export const COLORS = DARK_COLORS;

/**
 * Retorna la paleta de colores según el tema activo.
 * Úsalo en componentes nuevos: const C = getThemeColors(isDark);
 */
export function getThemeColors(isDark: boolean) {
    return isDark ? DARK_COLORS : LIGHT_COLORS;
}


/** Tipografía — alineada con SmartWallet spec */
export const TYPOGRAPHY = {
    family: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semibold: 'Inter_600SemiBold',
        bold: 'Inter_700Bold',
        // font-black no existe en Inter, bold es el máximo peso cargado
    },
    size: {
        /** 10px — labels uppercase tracking-widest */
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        /** 18px — sección contenido */
        xl: 18,
        /** 22px — section_titles font-black tracking-tight */
        '2xl': 22,
        '3xl': 28,
        /** 34px — currency_numbers text-4xl */
        '4xl': 34,
        /** 42px — currency_numbers text-5xl hero */
        hero: 42,
    },
    lineHeight: {
        tight: 1.1,    // tracking-tighter para currency
        normal: 1.5,
        relaxed: 1.75,
    },
    /** Tracking (letterSpacing) — de la spec */
    letterSpacing: {
        tighter: -1.5,    // tracking-tighter (currency)
        tight: -0.5,      // tracking-tight (titles)
        normal: 0,
        widest: 3,        // tracking-widest (labels uppercase)
    },
} as const;

/** Espaciado */
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
} as const;

/** Border radius — SmartWallet geometry */
export const RADIUS = {
    sm: 8,
    md: 12,
    /** 16px — button_radius (rounded-2xl) + icon containers */
    lg: 16,
    /** 20px */
    xl: 20,
    /** 24px */
    '2xl': 24,
    /** 40px — card_radius (rounded-[2.5rem]) */
    '3xl': 40,
    /** 48px — modal_radius / header (rounded-[3rem] / rounded-b-[3rem]) */
    '4xl': 48,
    full: 9999,
} as const;

/** Sombras — SmartWallet dark shadows */
export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    /** shadow-xl — cards */
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.40,
        shadowRadius: 16,
        elevation: 8,
    },
    /** shadow-2xl — floating elements */
    floating: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius: 24,
        elevation: 12,
    },
    glow: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
} as const;

/** Animaciones */
export const ANIMATION = {
    duration: {
        fast: 150,
        normal: 300,
        slow: 500,
        entrance: 600,
    },
    spring: {
        gentle: { damping: 15, stiffness: 150 },
        bouncy: { damping: 10, stiffness: 200 },
        stiff: { damping: 20, stiffness: 300 },
    },
} as const;
