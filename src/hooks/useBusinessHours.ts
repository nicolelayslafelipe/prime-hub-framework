import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

type OperatingHours = Record<string, DayHours>;

const defaultHours: OperatingHours = {
  monday: { open: '08:00', close: '22:00', isOpen: true },
  tuesday: { open: '08:00', close: '22:00', isOpen: true },
  wednesday: { open: '08:00', close: '22:00', isOpen: true },
  thursday: { open: '08:00', close: '22:00', isOpen: true },
  friday: { open: '08:00', close: '22:00', isOpen: true },
  saturday: { open: '09:00', close: '23:00', isOpen: true },
  sunday: { open: '09:00', close: '20:00', isOpen: true },
};

const dayKeyMap: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export function useBusinessHours() {
  const [hours, setHours] = useState<OperatingHours>(defaultHours);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'operating_hours')
          .maybeSingle();

        if (error) throw error;
        
        if (data?.value) {
          setHours(data.value as unknown as OperatingHours);
        }
      } catch (error) {
        console.error('Error fetching operating hours:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHours();
  }, []);

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const isCurrentlyOpen = useCallback((): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayKey = dayKeyMap[dayOfWeek];
    const todayHours = hours[dayKey];

    if (!todayHours || !todayHours.isOpen) {
      return false;
    }

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const openTime = parseTime(todayHours.open);
    const closeTime = parseTime(todayHours.close);

    const openTimeInMinutes = openTime.hours * 60 + openTime.minutes;
    let closeTimeInMinutes = closeTime.hours * 60 + closeTime.minutes;

    // Handle overnight hours (e.g., closes at 00:00 or 01:00)
    if (closeTimeInMinutes <= openTimeInMinutes) {
      closeTimeInMinutes += 24 * 60; // Add 24 hours
      const adjustedCurrentTime = currentTimeInMinutes < openTimeInMinutes 
        ? currentTimeInMinutes + 24 * 60 
        : currentTimeInMinutes;
      return adjustedCurrentTime >= openTimeInMinutes && adjustedCurrentTime < closeTimeInMinutes;
    }

    return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
  }, [hours]);

  const getNextOpeningTime = useCallback((): string | null => {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Check next 7 days
    for (let i = 0; i < 7; i++) {
      const checkDay = (dayOfWeek + i) % 7;
      const dayKey = dayKeyMap[checkDay];
      const dayHours = hours[dayKey];

      if (dayHours?.isOpen) {
        if (i === 0) {
          // Today
          const openTime = parseTime(dayHours.open);
          const openTimeInMinutes = openTime.hours * 60 + openTime.minutes;
          const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

          if (currentTimeInMinutes < openTimeInMinutes) {
            return `Abre às ${dayHours.open}`;
          }
        } else {
          const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
          return `Abre ${dayNames[checkDay]} às ${dayHours.open}`;
        }
      }
    }

    return null;
  }, [hours]);

  const getTodayHours = useCallback((): DayHours | null => {
    const dayOfWeek = new Date().getDay();
    const dayKey = dayKeyMap[dayOfWeek];
    return hours[dayKey] || null;
  }, [hours]);

  return {
    hours,
    isLoading,
    isCurrentlyOpen,
    getNextOpeningTime,
    getTodayHours,
  };
}
