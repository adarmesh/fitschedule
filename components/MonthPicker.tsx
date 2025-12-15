import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthPickerProps {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
    onClose: () => void;
}

export default function MonthPicker({ currentDate, onDateSelect, onClose }: MonthPickerProps) {
    const [viewedMonth, setViewedMonth] = useState(currentDate.getMonth());
    const [viewedYear, setViewedYear] = useState(currentDate.getFullYear());

    // Sync viewed month/year when currentDate changes from outside
    useEffect(() => {
        setViewedMonth(currentDate.getMonth());
        setViewedYear(currentDate.getFullYear());
    }, [currentDate]);

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInMonth = getDaysInMonth(viewedYear, viewedMonth);
    const firstDay = getFirstDayOfMonth(viewedYear, viewedMonth);
    const today = new Date();

    const changeMonth = (delta: number) => {
        let newMonth = viewedMonth + delta;
        let newYear = viewedYear;

        if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        }

        setViewedMonth(newMonth);
        setViewedYear(newYear);
    };

    const isSelectedDateVisible =
        currentDate.getMonth() === viewedMonth &&
        currentDate.getFullYear() === viewedYear;

    // Build calendar grid data using useMemo for stability
    const calendarGrid = React.useMemo(() => {
        const gridData = [];
        const totalCells = 42; // 6 weeks * 7 days

        for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
            const weekDays = [];
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const cellIndex = weekIndex * 7 + dayIndex;
                const dayNumber = cellIndex - firstDay + 1;
                const isValidDay = dayNumber >= 1 && dayNumber <= daysInMonth;

                weekDays.push({
                    cellIndex,
                    dayNumber: isValidDay ? dayNumber : null,
                    isValidDay,
                });
            }
            gridData.push(weekDays);
        }
        return gridData;
    }, [viewedMonth, viewedYear, firstDay, daysInMonth]);

    const renderDay = (day: { cellIndex: number; dayNumber: number | null; isValidDay: boolean }) => {
        if (!day.isValidDay || day.dayNumber === null) {
            return <View key={`empty-${day.cellIndex}`} style={styles.dayCell} />;
        }

        const isToday =
            day.dayNumber === today.getDate() &&
            viewedMonth === today.getMonth() &&
            viewedYear === today.getFullYear();

        const isSelected = isSelectedDateVisible && day.dayNumber === currentDate.getDate();

        return (
            <TouchableOpacity
                key={`day-${day.dayNumber}`}
                style={[styles.dayCell, isSelected && styles.selectedDay]}
                onPress={() => onDateSelect(new Date(viewedYear, viewedMonth, day.dayNumber!))}
            >
                <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>
                    {day.dayNumber}
                </Text>
            </TouchableOpacity>
        );
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>
                    {monthNames[viewedMonth]} {viewedYear}
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

            {calendarGrid.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.weekRow}>
                    {week.map(renderDay)}
                </View>
            ))}

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
        width: '14.28%',
        height: 40,
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
