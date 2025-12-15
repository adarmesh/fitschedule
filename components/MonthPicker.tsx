import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthPickerProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
}

export default function MonthPicker({ currentDate, onDateSelect, onClose }: MonthPickerProps) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const changeMonth = (delta: number) => {
        const newDate = new Date(year, month + delta, 1);
        onDateSelect(newDate);
    };

    const weeks = [];
    let days = [];

    // Empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
        days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

        const isSelected = day === currentDate.getDate();

        days.push(
            <TouchableOpacity
                key={day}
                style={[styles.dayCell, isSelected && styles.selectedDay]}
                onPress={() => onDateSelect(new Date(year, month, day))}
            >
                <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>
                    {day}
                </Text>
            </TouchableOpacity>
        );

        if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
            weeks.push(
                <View key={`week-${weeks.length}`} style={styles.weekRow}>
                    {days}
                </View>
            );
            days = [];
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <Text key={i} style={styles.weekdayText}>{d}</Text>
                ))}
            </View>

            {weeks}

            <TouchableOpacity style={styles.todayButton} onPress={() => onDateSelect(new Date())}>
                <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    weekdayRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekdayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    dayText: {
        fontSize: 14,
        color: '#ccc',
    },
    todayText: {
        color: '#4f46e5',
        fontWeight: '700',
    },
    selectedDay: {
        backgroundColor: '#4f46e5',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: '600',
    },
    todayButton: {
        marginTop: 12,
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    todayButtonText: {
        color: '#4f46e5',
        fontSize: 14,
        fontWeight: '600',
    },
});
