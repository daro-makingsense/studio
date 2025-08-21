'use client';

import React, { useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { addDays, subDays, format, isSameDay, getDay, nextMonday, isWithinInterval, previousFriday, isAfter, isBefore } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import type { Task, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User as UserIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Ellipsis, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateTaskModal from '@/components/create-task-modal';
import NoveltyBanner from '@/components/novelty-banner';
import { TaskCard } from '@/components/task-card';




const shifts = [
  { start: '08:00', end: '13:00' },
  { start: '18:00', end: '22:30' }
];





const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const START_HOUR = 7;
const END_HOUR = 23;
const SLOT_DURATION = 30;
const SLOT_HEIGHT = 40;
const COLLAPSED_SLOT_HEIGHT = 1;

const allTimeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * SLOT_DURATION;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

const TimeRuler = ({ activeSlots }: { activeSlots: { [key: string]: boolean } }) => {
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

const UserColumn = ({ user, currentUser, tasksForDay, selectedDate, activeSlots, totalHeight, onAddTask, onDragStart, onDragOver, onDragLeave, onDrop, dragOverTarget, canManageTasks }: { user: User, currentUser: User | null, tasksForDay: Task[], selectedDate: Date, activeSlots: { [key: string]: boolean }, totalHeight: number, onAddTask: (date: Date, userId: string) => void, onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void, onDragOver: (e: React.DragEvent<HTMLDivElement>, userId: string, date: Date) => void, onDragLeave: () => void, onDrop: (e: React.DragEvent<HTMLDivElement>, userId: string, date: Date) => void, dragOverTarget: { userId: string, date: Date } | null, canManageTasks: boolean }) => {
    const dayKey = format(selectedDate, 'EEEE', { locale: enUS });
    
    // Sort all tasks by start time (tasks with start time first, ordered by time, then tasks without start time)
    const sortedTasks = [...tasksForDay].sort((a, b) => {
        if (a.startTime && b.startTime) {
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
        }
        if (a.startTime && !b.startTime) return -1;
        if (!a.startTime && b.startTime) return 1;
        return 0;
    });
    


    const workDay = user.workHours[dayKey as keyof typeof user.workHours];

    const renderWorkHoursBlock = () => {
        if (!workDay || !workDay.active) return null;
       
        let top = 0;
        let calculatedHeight = 0;
        
        for (const slot of allTimeSlots) {
          const slotMinutes = timeToMinutes(slot);
          const slotHeight = activeSlots[slot] ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
          if (slotMinutes < timeToMinutes(workDay.start || shifts[0].start)) {
            top += slotHeight;
          } else if (slotMinutes < timeToMinutes(workDay.end || shifts[1].end)) {
            calculatedHeight += slotHeight;
          }
        }

        if (calculatedHeight <= 0) return null;

        const isDropTarget = dragOverTarget?.userId === user.id;
        
        return (
            <div 
                className={cn("absolute w-full p-2 transition-colors duration-200", isDropTarget && "bg-primary/20")} 
                style={{ top: `${top}px`, height: `${calculatedHeight}px`, backgroundColor: isDropTarget ? undefined : `${user.color}1A` }}
                onDragOver={(e) => onDragOver(e, user.id, selectedDate)}
                onDrop={(e) => onDrop(e, user.id, selectedDate)}
                onDragLeave={onDragLeave}
            >
                <div className="text-xs font-semibold opacity-70 mb-2" style={{color: user.color}}>{workDay.start || shifts[0].start} - {workDay.end || shifts[1].end} ({workDay.virtual ? 'Virtual' : 'Presencial'})</div>
                <div className="space-y-2 overflow-hidden" style={{ maxHeight: canManageTasks ? `${calculatedHeight - 60}px` : `${calculatedHeight - 30}px` }}>
                  {sortedTasks.map(task => {
                    const canChangeStatus = canManageTasks || currentUser?.id === task.userId;
                    return (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        canChangeStatus={canChangeStatus} 
                        variant="timeline" 
                        draggable={canManageTasks}
                        onDragStart={onDragStart}
                        canManageTasks={canManageTasks}
                      />
                    );
                  })}
                </div>
                {canManageTasks && (
                    <div className="absolute bottom-2 left-2 right-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs opacity-70 hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm" 
                            onClick={() => onAddTask(selectedDate, user.id)}
                        >
                            <PlusCircle className="mr-2 h-3 w-3" />
                            Agregar Tarea
                        </Button>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div className="relative border-r bg-background">
            {/* Background fill for entire column */}
            <div className="absolute inset-0 bg-background" style={{height: totalHeight}}></div>
            <div className="relative" style={{height: totalHeight}}>
                {renderWorkHoursBlock()}
            </div>
        </div>
    )
}

const DailyTimeline = ({ selectedDate, onAddTask }: { selectedDate: Date, onAddTask: (date: Date, userId: string) => void }) => {
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
    return tasks.filter(t => {
      if (t.status === 'archived') return false;
      if (t.status === 'done' && t.endDate && selectedDate >= new Date(t.endDate)) return false;
      return selectedDate >= new Date(t.startDate);
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
    return calendarEvents.filter(event => isWithinInterval(selectedDate, { start: new Date(event.start), end: new Date(event.end) }));
  }, [calendarEvents, selectedDate]);
  
  const activeSlots = useMemo(() => {
    const active = {} as { [key: string]: boolean };

    for (const slot of allTimeSlots) {
        const slotMinutes = timeToMinutes(slot);
        let isSlotActive = false;

        for(const shift of shifts) {
            if(slotMinutes >= timeToMinutes(shift.start) && slotMinutes < timeToMinutes(shift.end)) {
                isSlotActive = true;
                break;
            }
        }
        if(isSlotActive) {
            active[slot] = true;
            continue;
        }

        for (const user of usersForDay) {
            const workDay = user.workHours[dayKey];
            if (workDay) {
                if (slotMinutes >= timeToMinutes(workDay.start || shifts[0].start) && slotMinutes < timeToMinutes(workDay.end || shifts[0].end)) {
                    isSlotActive = true;
                    break;
                }
            }
        }
         if(isSlotActive) {
            active[slot] = true;
            continue;
        }

        for (const task of tasksForDay) {
            if(task.startTime && task.status !== 'archived') {
                const taskStartMinutes = timeToMinutes(task.startTime);
                const taskEndMinutes = taskStartMinutes + (task.duration || SLOT_DURATION);
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
          <div className="sticky left-0 z-10 bg-background"><TimeRuler activeSlots={activeSlots}/></div>
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


export default function TimelinePage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { users, currentUser } = useContext(UserContext);
  const { tasks, calendarEvents, novelties, markNoveltyAsViewed } = useContext(DataContext);
  const [isClient, setIsClient] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState<Date>();
  const [taskUserId, setTaskUserId] = useState<string>();

  const handleAddTask = useCallback((date: Date, userId: string) => {
    setTaskStartDate(date);
    setTaskUserId(userId);
    setIsTaskModalOpen(true);
  }, []);

  const hasActivity = useCallback((date: Date) => {
    const dayKey = format(date, 'EEEE', { locale: enUS });
    const dayIndex = getDay(date);
    const hasWorkHours = users.some(u => u.workHours[dayKey as keyof User['workHours']]?.active);
    const hasTasks = tasks.some(t => {
        if (t.status === 'archived') return false;
        if (t.startDate) {
            const taskStartDate = new Date(t.startDate);
            const taskEndDate = t.endDate ? new Date(t.endDate) : new Date(8640000000000000);
            if (!isWithinInterval(date, { start: taskStartDate, end: taskEndDate })) return false;
            
            if (t.days && t.days.length > 0) {
                const taskDayIndices = t.days.map(d => (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(d) + 1) % 7);
                return taskDayIndices.includes(dayIndex);
            } else {
                return isSameDay(taskStartDate, date);
            }
        }
        return false;
    });
    const hasEvents = calendarEvents.some(e => isWithinInterval(date, { start: new Date(e.start), end: new Date(e.end) }));
    return hasWorkHours || hasTasks || hasEvents;
  }, [users, tasks, calendarEvents]);

  useEffect(() => {
    setIsClient(true);
    let initialDate = new Date();
    const dayOfWeek = getDay(initialDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend && !hasActivity(initialDate)) {
        initialDate = nextMonday(initialDate);
    }
    setSelectedDate(initialDate);
  }, [hasActivity]);
  


  const handleNextDay = () => {
    if (!selectedDate) return;
    let nextDate = addDays(selectedDate, 1);
    
    // Si es viernes, salta a lunes
    if(getDay(selectedDate) === 5) {
        nextDate = addDays(selectedDate, 3);
    }
    
    // Bucle para saltar fines de semana vacíos
    while (true) {
        const dayOfWeek = getDay(nextDate); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend || hasActivity(nextDate)) break; 

        nextDate = addDays(nextDate, 1);
    }
    setSelectedDate(nextDate);
  };
  
  const handlePrevDay = () => {
      if(!selectedDate) return;
      let prevDate = subDays(selectedDate, 1);
       
       if(getDay(selectedDate) === 1) { // Si es Lunes
           prevDate = subDays(selectedDate, 3); // Salta a Viernes
       }
      
      while(true) {
        const dayOfWeek = getDay(prevDate);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend || hasActivity(prevDate)) break;

        prevDate = subDays(prevDate, 1);
      }
      setSelectedDate(prevDate);
  }

  if (!isClient || !selectedDate) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between pb-4 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-6 w-80" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-16" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card className="flex-grow flex flex-col">
                <CardContent className="p-0 flex-grow relative overflow-hidden flex flex-col">
                    <Skeleton className="h-full w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
       {/* Header with just the title */}
       <div className="pb-4">
         <h1 className="text-3xl font-bold font-headline">Cronograma Diario</h1>
       </div>

      {/* Novelties section */}
      <NoveltyBanner 
        novelties={novelties} 
        currentDate={selectedDate} 
        currentUser={currentUser}
        onDismiss={markNoveltyAsViewed}
        mode="day" 
      />

       {/* Date and navigation aligned to left */}
       <div className="flex items-center justify-start gap-2 pb-4">
         <Button variant="outline" size="sm" onClick={handlePrevDay} className="bg-white shadow-sm border-gray-300 hover:bg-gray-50">
           <ChevronLeft className="h-4 w-4" />
         </Button>
         <span className="text-xl font-semibold capitalize px-4">
           {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccionar fecha"}
         </span>
         <Button variant="outline" size="sm" onClick={handleNextDay} className="bg-white shadow-sm border-gray-300 hover:bg-gray-50">
           <ChevronRight className="h-4 w-4" />
         </Button>
       </div>

      <Card className="flex-grow flex flex-col bg-background">
        <CardContent className="p-0 flex-grow relative overflow-auto flex flex-col bg-background">
            {selectedDate && <DailyTimeline selectedDate={selectedDate} onAddTask={handleAddTask} />}
        </CardContent>
      </Card>

      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-2xl">
          {taskUserId && <CreateTaskModal closeDialog={() => setIsTaskModalOpen(false)} startDate={taskStartDate} userId={taskUserId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
