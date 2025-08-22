'use client';

import { allTimeSlots, SLOT_HEIGHT, COLLAPSED_SLOT_HEIGHT } from "./constants";


export const TimeScale = ({ activeSlots }: { activeSlots: { [key: string]: boolean } }) => {
  return (
    <div className="relative border-r bg-background">
      {allTimeSlots.map((time, index) => {
        const isActive = activeSlots[time];
        const height = isActive ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
        const isHourMark = time.endsWith(':00');
        // Only show times when the slot is active (has enough space)
        const showTime = isActive;
        
        return (
          <div key={time} style={{ height }} className="relative flex items-center transition-all duration-300 bg-background">
            {showTime && (
            <span className={`absolute left-1 text-xs ${isHourMark ? 'font-semibold text-foreground' : 'text-muted-foreground'}`} style={{ top: '50%', transform: 'translateY(-50%)' }}>
              {time}
            </span>
            )}
            {isActive && isHourMark && (
              <div className="absolute right-0 top-0 w-2 h-px bg-border"></div>
            )}
          </div>
        )
      })}
    </div>
  );
};