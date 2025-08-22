'use client';

import React, { useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { format, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import type { Task, User } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, Calendar as CalendarIcon } from 'lucide-react';
import { TimeScale } from './time-scale';
import { UserColumn } from './user-box';
import { allTimeSlots, SLOT_HEIGHT, COLLAPSED_SLOT_HEIGHT, SLOT_DURATION } from './constants';

const timeToMinutes = (time: string): number => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };


const ShiftColumn = ({ totalHeight, activeSlots }: { totalHeight: number, activeSlots: { [key: string]: boolean } }) => {
    const shifts = [
        { name: 'TM', start: '08:00', end: '13:00', class: 'bg-blue-500/20 text-blue-900' },
        { name: 'TV', start: '18:00', end: '22:30', class: 'bg-indigo-500/20 text-indigo-900' }
    ];

    return (
        <div className="relative w-10 border-r bg-background" style={{ height: totalHeight }}>
            {shifts.map(shift => {
                const startMinutes = timeToMinutes(shift.start);
                const endMinutes = timeToMinutes(shift.end);

                let top = 0;
                let calculatedHeight = 0;

                for (const slot of allTimeSlots) {
                    const slotMinutes = timeToMinutes(slot);
                    const slotHeight = activeSlots[slot] ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
                    if (slotMinutes < startMinutes) {
                        top += slotHeight;
                    } else if (slotMinutes < endMinutes) {
                        calculatedHeight += slotHeight;
                    }
                }
                
                if (calculatedHeight <= 0) return null;

                return (
                    <div key={shift.name} className={cn("absolute w-full flex items-center justify-center font-bold text-xs", shift.class)} style={{ top: `${top}px`, height: `${calculatedHeight}px` }}>
                       {shift.name}
                    </div>
                );
            })}
        </div>
    )
}

export const DailyTimeline = ({ selectedDate, onAddTask }: { selectedDate: Date, onAddTask: (date: Date, userId: string) => void }) => {
  const { users, currentUser } = useContext(UserContext);
  const { tasks, calendarEvents, updateTask, refreshData } = useContext(DataContext);
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ userId: string, date: Date } | null>(null);
  const isResizing = useRef<string | null>(null);
  const initialX = useRef<number>(0);
  
  const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  
  const dayKey = useMemo(() => format(selectedDate, 'EEEE', { locale: enUS }), [selectedDate]);
  const dayIndex = useMemo(() => getDay(selectedDate), [selectedDate]);

  const tasksForDay = useMemo(() => {
    const dayString = format(selectedDate, 'yyyy-MM-dd');
    return tasks.filter(t => {
      if (t.status === 'archived') return false;
      if (t.status === 'done' && t.endDate && dayString > t.endDate) return false;
      return dayString >= t.startDate;
    });
  }, [tasks, selectedDate, dayIndex]);

  const usersForDay = useMemo(() => {
    return users.filter(user => user.workHours[dayKey].active || user.workHours[dayKey].virtual ).sort((a,b) => {
        const aStart = timeToMinutes(a.workHours[dayKey].start || '00:00');
        const bStart = timeToMinutes(b.workHours[dayKey].start || '00:00');
        if (!aStart || !bStart) return 0;
        return aStart - bStart;
    });
  }, [users, dayKey]);
  
  useEffect(() => {
    const initialWidths: { [key: string]: number } = {};
    usersForDay.forEach(u => {
        const workDay = u.workHours[dayKey as keyof User['workHours']];
        if (!columnWidths[u.id]) {
            initialWidths[u.id] = workDay?.active ? 250 : 120;
        }
    });
    if (Object.keys(initialWidths).length > 0) {
        setColumnWidths(prev => ({ ...prev, ...initialWidths }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersForDay, dayKey]);


  const eventsForDay = useMemo(() => {
    const dayString = format(selectedDate, 'yyyy-MM-dd');
    return calendarEvents.filter(event => {
      // Use same string comparison logic as calendar page to avoid timezone issues
      return dayString >= event.start && dayString <= event.end;
    });
  }, [calendarEvents, selectedDate]);
  
  const activeSlots = useMemo(() => {
    const active = {} as { [key: string]: boolean };

    for (const slot of allTimeSlots) {
      const slotMinutes = timeToMinutes(slot);
      let isSlotActive = false;

      for (const user of usersForDay) {
        const workDay = user.workHours[dayKey];
        
        if (workDay) {
          // Include slots from start time up to and including end time for visual block coverage
          // This ensures the visual block extends to the full end time
          if (workDay.start && workDay.end) {
            if (slotMinutes >= timeToMinutes(workDay.start) && slotMinutes <= timeToMinutes(workDay.end)) {
              isSlotActive = true;
              break;
            }
          }
        }
      }

      for (const task of tasksForDay) {
        if(task.startTime && task.status !== 'archived') {
          const taskStartMinutes = timeToMinutes(task.startTime);
          const taskEndMinutes = taskStartMinutes + (task.duration || SLOT_DURATION);
          // Include slots from start time up to and including end time for visual block coverage
          // This ensures the visual block extends to the full end time
          if (slotMinutes >= taskStartMinutes && slotMinutes < taskEndMinutes) {
            isSlotActive = true;
            break;
          }
        }
      }
      
      active[slot] = isSlotActive;
    }
    return active;
  }, [usersForDay, tasksForDay, dayKey]);

  const totalHeight = useMemo(() => {
    return allTimeSlots.reduce((acc, slot) => acc + (activeSlots[slot] ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT), 0);
  }, [activeSlots]);

  const handleMouseDown = (userId: string, e: React.MouseEvent) => {
    isResizing.current = userId;
    initialX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const dx = e.clientX - initialX.current;
      setColumnWidths(prev => {
        const newWidth = (prev[isResizing.current!] || 200) + dx;
        return {
          ...prev,
          [isResizing.current!]: Math.max(100, newWidth) // min width
        };
      });
      initialX.current = e.clientX;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = null;
    document.body.style.cursor = 'default';
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    if (!canManageTasks) return;
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, userId: string, date: Date) => {
    e.preventDefault();
    if (!canManageTasks) return;
    setDragOverTarget({ userId, date });
  };

  const handleDragLeave = () => setDragOverTarget(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetUserId: string, targetDate: Date) => {
    e.preventDefault();
    if (!canManageTasks || !draggedTaskId) return;
    const taskToMove = tasks.find(t => t.id === draggedTaskId);
    if (taskToMove) {
      await updateTask({
        ...taskToMove,
        userId: targetUserId,
        startDate: targetDate.toISOString(),
      });
    }
    setDraggedTaskId(null);
    setDragOverTarget(null);
    refreshData();
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  if (usersForDay.length === 0 && eventsForDay.length === 0) {
      return <div className="p-8 text-center text-muted-foreground">Nadie tiene actividad programada para este día.</div>
  }

  const gridTemplateColumns = `60px 40px ${usersForDay.map(u => `${columnWidths[u.id] || 200}px`).join(' ')}`;

  return (
    <div className="relative h-full w-full flex flex-col bg-background">
       <div className="sticky top-0 z-20 bg-background">
        <div className="grid bg-background" style={{ gridTemplateColumns }}>
          {/* Header section */}
          <div className="sticky left-0 z-30 h-28 border-b border-r bg-background p-2 text-center"></div>
          <div className="sticky left-[60px] z-30 h-28 border-b border-r bg-background p-2 text-center"></div>
          {usersForDay.map(user => (
            <div key={user.id} className="relative h-28 flex flex-col items-center justify-center border-b border-r p-2 text-center bg-background">
              <UserIcon className="h-5 w-5 mb-1 shrink-0" style={{ color: user.color }} />
              <div className="font-semibold text-sm">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.positions.map(p => p.shortName).join(' / ')}</div>
               <div 
                  onMouseDown={(e) => handleMouseDown(user.id, e)}
                  className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-border/50 hover:bg-primary transition-colors"
                />
            </div>
          ))}
        </div>
        {/* Events for day */}
         {eventsForDay.length > 0 && (
           <div className="sticky top-[112px] z-30 bg-background border-b">
              <div className="grid" style={{ gridTemplateColumns }}>
                  {/* Time columns with proper background and borders */}
                  <div className="sticky left-0 z-40 bg-background border-r"></div>
                  <div className="sticky left-[60px] z-40 bg-background border-r"></div>
                  {/* Events span only user columns */}
                  <div className={`bg-accent/50 border-y p-2 text-center font-semibold text-accent-foreground`} style={{ gridColumn: `3 / ${3 + usersForDay.length}` }}>
                      <div className="flex items-center justify-center gap-4">
                          {eventsForDay.map(event => (
                              <div key={event.id} className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span className="font-bold">{event.title}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
           </div>
        )}
      </div>
      {/* Tasks for day */}
      <div className="bg-background">
        <div className="grid bg-background" style={{ gridTemplateColumns, position: 'relative' }}>
          <div className="sticky left-0 z-10 bg-background"><TimeScale activeSlots={activeSlots}/></div>
          <div className="sticky left-[60px] z-10 bg-background"><ShiftColumn totalHeight={totalHeight} activeSlots={activeSlots}/></div>
          {usersForDay.map(user => {
            const userTasks = tasksForDay.filter(t => t.userId === user.id);
            return (
              <UserColumn 
                key={user.id} 
                user={user} 
                currentUser={currentUser} 
                tasksForDay={userTasks} 
                selectedDate={selectedDate} 
                activeSlots={activeSlots} 
                totalHeight={totalHeight} 
                onAddTask={onAddTask}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                dragOverTarget={dragOverTarget}
                canManageTasks={canManageTasks}
              />
            )
          })}
        </div>
      </div>
    </div>
  );
};