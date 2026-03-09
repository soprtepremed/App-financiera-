/**
 * CategoryPicker — Selector visual de categorías de gasto
 * Grid de categorías con íconos Ionicons, búsqueda y selección
 * SmartWallet UI: icon containers rounded-2xl con fondos tintados
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories, getCategoryIconName } from '../../hooks/useCategories';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import type { ExpenseCategory } from '../../types/database';

interface CategoryPickerProps {
    /** ID de la categoría seleccionada */
    selectedId?: string;
    /** Callback al seleccionar una categoría */
    onSelect: (category: ExpenseCategory) => void;
}

/**
 * Grid de categorías con búsqueda filtrable.
 * Cada categoría se muestra como un ícono dentro de un contenedor
 * coloreado con el color de la categoría.
 */
export function CategoryPicker({ selectedId, onSelect }: CategoryPickerProps) {
    const { data: categories = [] } = useCategories();
    const [search, setSearch] = useState('');

    /** Filtra categorías por nombre */
    const filtered = useMemo(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories.filter(c => c.name.toLowerCase().includes(q));
    }, [categories, search]);

    return (
        <View style={styles.container}>
            {/* Buscador */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={16} color={COLORS.text.tertiary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar categoría..."
                    placeholderTextColor={COLORS.text.tertiary}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
            </View>

            {/* Grid de categorías */}
            <ScrollView
                style={styles.grid}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
            >
                {filtered.map((category) => {
                    const isSelected = category.id === selectedId;
                    const iconName = getCategoryIconName(category.icon) as keyof typeof Ionicons.glyphMap;

                    return (
                        <Pressable
                            key={category.id}
                            style={[
                                styles.categoryItem,
                                isSelected && styles.categoryItemSelected,
                            ]}
                            onPress={() => onSelect(category)}
                        >
                            {/* Contenedor del ícono — SVG icon container */}
                            <View
                                style={[
                                    styles.iconContainer,
                                    {
                                        backgroundColor: isSelected
                                            ? category.color
                                            : `${category.color}18`,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={22}
                                    color={isSelected ? '#FFFFFF' : category.color}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.categoryName,
                                    isSelected && styles.categoryNameSelected,
                                ]}
                                numberOfLines={2}
                            >
                                {category.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        maxHeight: 320,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background.tertiary,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontFamily: TYPOGRAPHY.family.regular,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text.primary,
        paddingVertical: SPACING.md,
    },
    grid: {
        flex: 1,
    },
    gridContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    categoryItem: {
        width: '30%',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: RADIUS.lg,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    categoryItemSelected: {
        borderColor: COLORS.accent.primary,
        backgroundColor: COLORS.iconContainer.primary,
    },
    // SVG icon container: p-3 rounded-2xl
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    categoryName: {
        fontFamily: TYPOGRAPHY.family.medium,
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
    categoryNameSelected: {
        color: COLORS.text.primary,
        fontFamily: TYPOGRAPHY.family.bold,
    },
});
