import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import EventModal from '@/components/calendar/EventModal';
import { useApp } from '@/context/AppContext';
import { Event } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HOUR_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 50;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Period {
  id: string;
  startDate: Date;
  days: Date[];
}

export default function CalendarScreen() {
  const { data, processCompletedEvents } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<{ date: string; time: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Start at middle page
  
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRefs = useRef<(ScrollView | null)[]>([]);
  const verticalScrollY = useRef(0);
  const isScrollingHorizontally = useRef(false);
  const isSyncingScroll = useRef(false);
  const shouldResetScroll = useRef(false);
  const previousDateRef = useRef(currentDate);
  const isSwipingRef = useRef(false);

  const viewType = data.settings.calendarViewType;
  const prevViewTypeRef = useRef(viewType);

  // Generate 3 periods (previous, current, next)
  const generatePeriods = useCallback((centerDate: Date): Period[] => {
    const daysToMove = viewType === 'day' ? 1 : viewType === '3day' ? 3 : 7;
    
    const previousDate = new Date(centerDate);
    previousDate.setDate(centerDate.getDate() - daysToMove);
    
    const nextDate = new Date(centerDate);
    nextDate.setDate(centerDate.getDate() + daysToMove);
    
    // Use date-based IDs so React can properly track and reuse components
    return [
      { id: previousDate.toISOString(), startDate: previousDate, days: getDaysToShow(previousDate, viewType) },
      { id: centerDate.toISOString(), startDate: centerDate, days: getDaysToShow(centerDate, viewType) },
      { id: nextDate.toISOString(), startDate: nextDate, days: getDaysToShow(nextDate, viewType) },
    ];
  }, [viewType]);

  // Initialize periods on mount
  useLayoutEffect(() => {
    const initialPeriods = generatePeriods(currentDate);
    setPeriods(initialPeriods);
    previousDateRef.current = currentDate;
    shouldResetScroll.current = true;
  }, []); // Only run on mount

  // Handle view type changes  
  useEffect(() => {
    if (periods.length > 0 && prevViewTypeRef.current !== viewType) {  // Only when view type actually changes
      prevViewTypeRef.current = viewType;
      isSwipingRef.current = true; // Prevent date change effect from interfering
      shouldResetScroll.current = true;
      previousDateRef.current = currentDate;
      setPeriods(generatePeriods(currentDate));
      setCurrentPageIndex(1);
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 100);
    }
  }, [viewType, currentDate, generatePeriods, periods.length]); // Include all dependencies

  function navigateDays(direction: number) {
    const daysToMove = viewType === 'day' ? 1 : viewType === '3day' ? 3 : 7;
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + direction * daysToMove);
      return newDate;
    });
  }

  // Handle date changes from TopBar navigation or date picker
  useEffect(() => {
    // Skip if we're in the middle of a swipe or if this is the initial mount
    if (isSwipingRef.current || periods.length === 0) {
      return;
    }
    
    // Check if the date actually changed
    const prevDate = previousDateRef.current;
    if (prevDate.toDateString() !== currentDate.toDateString()) {
      previousDateRef.current = currentDate;
      shouldResetScroll.current = true;
      setPeriods(generatePeriods(currentDate));
    }
  }, [currentDate, generatePeriods]);

  // Process completed events on app open
  useEffect(() => {
    processCompletedEvents();
    const interval = setInterval(processCompletedEvents, 60000);
    return () => clearInterval(interval);
  }, [processCompletedEvents]);

  // Scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const scrollToY = now.getHours() * HOUR_HEIGHT - 100;
    setTimeout(() => {
      verticalScrollRefs.current.forEach(ref => {
        ref?.scrollTo({ y: Math.max(0, scrollToY), animated: false });
      });
      verticalScrollY.current = Math.max(0, scrollToY);
    }, 150);
  }, []);

  function getDaysToShow(date: Date, view: 'day' | '3day' | 'week'): Date[] {
    const result: Date[] = [];
    const count = view === 'day' ? 1 : view === '3day' ? 3 : 7;

    const start = new Date(date);
    if (view === 'week') {
      start.setDate(start.getDate() - start.getDay());
    }

    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push(d);
    }
    return result;
  }

  function getCurrentTimePosition(): number {
    const now = new Date();
    return now.getHours() * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT;
  }

  function getEventsForDay(date: Date): Event[] {
    const dateStr = date.toISOString().split('T')[0];
    return data.events.filter((e) => e.date === dateStr);
  }

  // Handle horizontal scroll end - implement infinite scrolling
  const handleHorizontalScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    
    if (pageIndex !== currentPageIndex && periods.length > 0) {
      // Mark that we're handling a swipe to prevent the useEffect from interfering
      isSwipingRef.current = true;
      
      // Update periods based on which page we're on
      if (pageIndex === 0) {
        // Scrolled to previous period
        const newDate = periods[0].startDate;
        previousDateRef.current = newDate;
        shouldResetScroll.current = true;
        setPeriods(generatePeriods(newDate));
        setCurrentDate(newDate);
        setCurrentPageIndex(1);
      } else if (pageIndex === 2) {
        // Scrolled to next period
        const newDate = periods[2].startDate;
        previousDateRef.current = newDate;
        shouldResetScroll.current = true;
        setPeriods(generatePeriods(newDate));
        setCurrentDate(newDate);
        setCurrentPageIndex(1);
      } else {
        setCurrentPageIndex(pageIndex);
      }
      
      // Reset the swipe flag after a brief delay
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 100);
    }
  };

  // Unified scroll reset logic - runs synchronously after periods update
  useLayoutEffect(() => {
    if (shouldResetScroll.current && periods.length === 3) {
      shouldResetScroll.current = false;
      horizontalScrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
    }
  }, [periods]);

  // Track vertical scroll position
  const handleVerticalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingHorizontally.current || isSyncingScroll.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    verticalScrollY.current = offsetY;
  };

  // Sync scroll positions when momentum scrolling ends
  const handleVerticalScrollEnd = () => {
    if (isScrollingHorizontally.current) return;
    
    isSyncingScroll.current = true;
    const targetY = verticalScrollY.current;
    
    // Use requestAnimationFrame for smoother sync
    requestAnimationFrame(() => {
      // Sync all vertical scrollviews to the same position
      verticalScrollRefs.current.forEach((ref) => {
        if (ref) {
          ref.scrollTo({ y: targetY, animated: false });
        }
      });
      
      // Reset sync flag after a brief moment
      setTimeout(() => {
        isSyncingScroll.current = false;
      }, 50);
    });
  };

  const currentTimePosition = getCurrentTimePosition();

  const renderPeriod = (period: Period, periodIndex: number) => {
    const days = period.days;
    const dayWidth = (SCREEN_WIDTH - TIME_COLUMN_WIDTH) / days.length;

    return (
      <View key={period.id} style={styles.periodContainer}>
        {/* Day headers for this period */}
        <View style={styles.dayHeaders}>
          {days.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const headerWidth = SCREEN_WIDTH / days.length;
            return (
              <View key={i} style={[styles.dayHeader, { width: headerWidth }]}>
                <Text style={[styles.dayName, isToday && styles.todayText]}>
                  {day.toLocaleDateString('en', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                  {day.getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Vertical scrollview with grid for this period */}
        <ScrollView
          ref={(ref) => (verticalScrollRefs.current[periodIndex] = ref)}
          style={styles.scrollView}
          scrollEventThrottle={16}
          onScroll={handleVerticalScroll}
          onMomentumScrollEnd={handleVerticalScrollEnd}
          showsVerticalScrollIndicator={true}
          bounces={true}
          alwaysBounceVertical={true}
          decelerationRate="normal"
        >
          <View style={styles.grid}>
            {/* Time column */}
            <View style={styles.timeColumn}>
              {Array.from({ length: 24 }).map((_, hour) => (
                <View key={hour} style={styles.timeSlot}>
                  <Text style={styles.timeText}>
                    {hour.toString().padStart(2, '0')}:00
                  </Text>
                </View>
              ))}
            </View>

            {/* Day columns */}
            {days.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <View key={dayIndex} style={[styles.dayColumn, { width: dayWidth }]}>
                  {Array.from({ length: 48 }).map((_, slotIndex) => (
                    <View key={slotIndex} style={styles.slot} />
                  ))}

                  {/* Render events */}
                  {dayEvents.map((event) => {
                    const [hours, mins] = event.time.split(':').map(Number);
                    const top = hours * HOUR_HEIGHT + (mins / 60) * HOUR_HEIGHT;
                    const height = (event.duration / 60) * HOUR_HEIGHT;
                    const isSkipped = event.status === 'skipped';

                    const member = data.members.find((m) => m.id === event.memberId);
                    const group = data.groups.find((g) => g.id === event.groupId);
                    const eventName = event.type === 'person' ? member?.name : group?.name;

                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.event,
                          { top, height: Math.max(height, 30) },
                          isSkipped && styles.skippedEvent,
                          event.type === 'group' && styles.groupEvent,
                        ]}
                        onPress={() => setSelectedEvent(event)}
                      >
                        <View style={styles.eventContent}>
                          <Ionicons
                            name={event.type === 'person' ? 'person' : 'people'}
                            size={12}
                            color={isSkipped ? '#888' : '#fff'}
                            style={styles.eventIcon}
                          />
                          <Text
                            style={[styles.eventText, isSkipped && styles.skippedText]}
                            numberOfLines={1}
                          >
                            {eventName || 'Unnamed'}
                          </Text>
                        </View>
                        {height >= 40 && (
                          <Text style={[styles.eventTime, isSkipped && styles.skippedText]}>
                            {event.time}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Current time line */}
                  {isToday && (
                    <View style={[styles.currentTimeLine, { top: currentTimePosition }]}>
                      <View style={styles.currentTimeDot} />
                      <View style={styles.currentTimeBar} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        onMenuPress={() => setSidebarOpen(true)}
        onPlusPress={() => {
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${Math.floor(now.getMinutes() / 30) * 30 === 0 ? '00' : '30'}`;
          setSelectedTime({ date: dateStr, time: timeStr });
        }}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />

      {/* Horizontal scrollview with pagination */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="normal"
        bounces={false}
        onMomentumScrollEnd={(event) => {
          handleHorizontalScrollEnd(event);
          // Reset the horizontal scrolling flag after momentum ends
          setTimeout(() => {
            isScrollingHorizontally.current = false;
          }, 100);
        }}
        onScrollBeginDrag={() => {
          isScrollingHorizontally.current = true;
        }}
        onMomentumScrollBegin={() => {
          isScrollingHorizontally.current = true;
        }}
        style={styles.horizontalScrollView}
      >
        {periods.map((period, index) => renderPeriod(period, index))}
      </ScrollView>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {(selectedTime || selectedEvent) && (
        <EventModal
          date={selectedTime?.date || selectedEvent?.date || ''}
          time={selectedTime?.time || selectedEvent?.time || ''}
          event={selectedEvent}
          onClose={() => {
            setSelectedTime(null);
            setSelectedEvent(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  horizontalScrollView: {
    flex: 1,
  },
  periodContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 8,
  },
  dayHeader: {
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    color: '#888',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  todayText: {
    color: '#4f46e5',
  },
  todayNumber: {
    color: '#fff',
    backgroundColor: '#4f46e5',
    width: 32,
    height: 32,
    lineHeight: 32,
    borderRadius: 16,
    textAlign: 'center',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
  },
  timeSlot: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingRight: 8,
  },
  timeText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  dayColumn: {
    borderLeftWidth: 1,
    borderLeftColor: '#1a1a1a',
    position: 'relative',
  },
  slot: {
    height: HOUR_HEIGHT / 2,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  event: {
    position: 'absolute',
    left: 2,
    right: 2,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    padding: 6,
    overflow: 'hidden',
  },
  groupEvent: {
    backgroundColor: '#22c55e',
  },
  skippedEvent: {
    backgroundColor: '#333',
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    marginRight: 4,
  },
  eventText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  eventTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  skippedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: -4,
  },
  currentTimeBar: {
    flex: 1,
    height: 2,
    backgroundColor: '#ef4444',
  },
});
