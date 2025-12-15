import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MonthPicker from './MonthPicker';

interface TopBarProps {
    onMenuPress: () => void;
    onPlusPress: () => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export default function TopBar({ onMenuPress, onPlusPress, currentDate, onDateChange }: TopBarProps) {
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [isPickerMounted, setIsPickerMounted] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    useEffect(() => {
        if (showMonthPicker) {
            setIsPickerMounted(true);
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setIsPickerMounted(false);
            });
        }
    }, [showMonthPicker, slideAnim]);

    const pickerTranslateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-350, 0],
    });

    const pickerOpacity = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

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

            <TouchableOpacity style={styles.plusButton} onPress={onPlusPress}>
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>

            {isPickerMounted && (
                <View style={styles.pickerContainer}>
                    <Animated.View
                        style={[
                            styles.pickerAnimatedWrapper,
                            {
                                transform: [{ translateY: pickerTranslateY }],
                                opacity: pickerOpacity,
                            },
                        ]}
                    >
                        <MonthPicker
                            currentDate={currentDate}
                            onDateSelect={(date) => {
                                onDateChange(date);
                                setShowMonthPicker(false);
                            }}
                            onClose={() => setShowMonthPicker(false)}
                        />
                    </Animated.View>
                </View>
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
    plusButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        position: 'absolute',
        top: 64,
        left: 0,
        right: 0,
        overflow: 'hidden',
        zIndex: 100,
    },
    pickerAnimatedWrapper: {
        width: '100%',
    },
});
