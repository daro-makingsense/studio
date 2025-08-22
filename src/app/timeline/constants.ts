export const START_HOUR = 7;
export const END_HOUR = 23;
export const SLOT_DURATION = 30;
export const SLOT_HEIGHT = 40;
export const COLLAPSED_SLOT_HEIGHT = 1;

export const shifts = [
    { start: '08:00', end: '13:00' },
    { start: '18:00', end: '22:30' }
  ];

export const allTimeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * SLOT_DURATION;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});