import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MonthPicker from './MonthPicker';

interface TopBarProps {
    onMenuPress: () => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export default function TopBar({ onMenuPress, currentDate, onDateChange }: TopBarProps) {
    const { data } = useApp();
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
                <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.monthSelector}
                onPress={() => setShowMonthPicker(!showMonthPicker)}
            >
                <Text style={styles.monthText}>{monthYear}</Text>
                <Ionicons
                    name={showMonthPicker ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#888"
                />
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarContainer}>
                {data.profile.avatarUri ? (
                    <Image source={{ uri: data.profile.avatarUri }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                            {data.profile.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {showMonthPicker && (
                <MonthPicker
                    currentDate={currentDate}
                    onDateSelect={(date) => {
                        onDateChange(date);
                        setShowMonthPicker(false);
                    }}
                    onClose={() => setShowMonthPicker(false)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    monthText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    avatarContainer: {
        width: 40,
        height: 40,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
