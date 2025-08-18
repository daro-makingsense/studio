'use client';

import React, { useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { addDays, subDays, format, isSameDay, getDay, nextMonday, isWithinInterval, previousFriday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import type { Task, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlusCircle, User as UserIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Megaphone, Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const priorityClasses = {
  high: 'bg-red-100',
  medium: 'bg-yellow-100',
  low: 'bg-green-100',
};

const priorityBarClasses = {
  high: '#ef4444', medium: '#f59e0b', low: '#22c55e',
};

const priorityText = {
  high: 'CUANTO ANTES',
  medium: 'CUANDO SEA POSIBLE',
  low: 'AVANZAR EN MOMENTOS LIBRES',
};

const priorityTextColor = {
  high: 'text-red-900',
  medium: 'text-amber-600',
  low: 'text-blue-600',
}

const statusMap: { [key: string]: string } = {
    todo: 'Por hacer',
    'in-progress': 'En progreso',
    done: 'Hecho',
};

const statusColors: { [key: string]: string } = {
  todo: 'hsl(var(--status-todo))',
  'in-progress': 'hsl(var(--status-in-progress))',
  done: 'hsl(var(--status-done))',
};

const TaskCard = ({ task, canChangeStatus }: { task: Task, canChangeStatus: boolean }) => {
    return (
        <div
            key={task.id}
            className={cn(
                'relative p-3 flex flex-col rounded-lg shadow-lg transition-all', 
                priorityClasses[task.priority],
                task.status === 'done' && 'opacity-60'
            )}
            style={{ borderTop: `10px solid ${priorityBarClasses[task.priority]}` }}
        >
            <h4 className={cn("font-bold text-sm mb-1 pb-1 border-b border-black/10", task.status === 'done' && 'line-through')}>{task.title}</h4>
            {task.startTime && <p className="text-xs font-semibold text-gray-800/90">{task.startTime} ({task.duration}m)</p>}
            <p className="flex-grow text-xs text-gray-800/90 overflow-auto">{task.description}</p>
            <div className="mt-auto pt-1 flex items-center justify-between text-xs text-gray-600/90">
                {!task.startTime && <span className={cn("font-bold", priorityTextColor[task.priority])}>{priorityText[task.priority]}</span>}
                <TaskStatusChanger task={task} canChangeStatus={canChangeStatus} />
            </div>
        </div>
    )
}

const TaskStatusChanger = ({ task, canChangeStatus }: { task: Task; canChangeStatus: boolean }) => {
  const { updateTask } = useContext(DataContext);
  const statuses = ['todo', 'in-progress', 'done'];

  if (!canChangeStatus) {
    return (
      <div className="flex items-center gap-2 ml-auto">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[task.status] }} />
          <span className="text-xs font-semibold">{statusMap[task.status]}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 ml-auto -mr-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[task.status] }} />
            <span className="text-xs font-semibold">{statusMap[task.status]}</span>
            <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statuses.map(status => (
          <DropdownMenuItem 
            key={status} 
            onSelect={() => updateTask({ ...task, status: status as Task['status'] })}
            disabled={task.status === status}
          >
            {statusMap[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
    <div className="relative border-r">
      {allTimeSlots.map((time, index) => {
        const isActive = activeSlots[time];
        const height = isActive ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
        return (
         <div key={time} style={{ height }} className="relative flex items-start border-b transition-all duration-300">
           {isActive && (
            <span className="absolute left-2 -translate-y-1/2 text-sm text-muted-foreground" style={{ top: index === 0 ? '5px' : '0' }}>{time}</span>
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
        <div className="relative w-10 border-r" style={{ height: totalHeight }}>
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

const UserColumn = ({ user, currentUser, tasksForDay, selectedDate, activeSlots, totalHeight }: { user: User, currentUser: User | null, tasksForDay: Task[], selectedDate: Date, activeSlots: { [key: string]: boolean }, totalHeight: number }) => {
    const dayKey = format(selectedDate, 'EEEE', { locale: enUS });
    
    const tasksWithTime = tasksForDay.filter(t => t.startTime);
    const tasksWithoutTime = tasksForDay.filter(t => !t.startTime);
    
    const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    const workDay = user.workHours[dayKey as keyof typeof user.workHours];
    
    const calculateTopPosition = (time: string) => {
        let position = 0;
        for (const slot of allTimeSlots) {
            if (slot === time) break;
            position += activeSlots[slot] ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
        }
        return position;
    }

    const renderWorkHoursBlock = () => {
        if (!workDay || !workDay.active || !workDay.start || !workDay.end) return null;
       
        let top = 0;
        let calculatedHeight = 0;
        
        for (const slot of allTimeSlots) {
          const slotMinutes = timeToMinutes(slot);
          const slotHeight = activeSlots[slot] ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
          if (slotMinutes < timeToMinutes(workDay.start!)) {
            top += slotHeight;
          } else if (slotMinutes < timeToMinutes(workDay.end!)) {
            calculatedHeight += slotHeight;
          }
        }

        if (calculatedHeight <= 0) return null;

        return (
            <div className="absolute w-full p-2" style={{ top: `${top}px`, height: `${calculatedHeight}px`, backgroundColor: `${user.color}1A` }}>
                <div className="text-xs font-semibold opacity-70 mb-2" style={{color: user.color}}>{workDay.start} - {workDay.end} ({workDay.virtual ? 'Virtual' : 'Presencial'})</div>
                <div className="space-y-2">
                  {tasksWithoutTime.map(task => {
                    const canChangeStatus = canManageTasks || currentUser?.id === task.userId;
                    return <TaskCard key={task.id} task={task} canChangeStatus={canChangeStatus} />;
                  })}
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative border-r">
            <div className="relative" style={{height: totalHeight}}>
                {renderWorkHoursBlock()}
                {tasksWithTime.map(task => {
                    if (!task.startTime) return null;
                    const duration = task.duration || SLOT_DURATION;
                    
                    let top = calculateTopPosition(task.startTime);
                    
                    let calculatedHeight = 0;
                    const taskStartMinutes = timeToMinutes(task.startTime);
                    const taskEndMinutes = taskStartMinutes + duration;

                    for (const slot of allTimeSlots) {
                        const slotMinutes = timeToMinutes(slot);
                        if (slotMinutes >= taskStartMinutes && slotMinutes < taskEndMinutes) {
                            calculatedHeight += activeSlots[slot] ? SLOT_HEIGHT : COLLAPSED_SLOT_HEIGHT;
                        }
                    }

                    const canChangeStatus = canManageTasks || currentUser?.id === task.userId;
                    
                    return (
                        <div key={task.id} className={cn('absolute p-2 flex flex-col rounded-lg shadow-lg transition-transform w-[95%] left-[2.5%] bg-background z-10')} style={{ top: `${top}px`, height: `${calculatedHeight - 2}px` }}>
                           <TaskCard task={task} canChangeStatus={canChangeStatus}/>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

const DailyTimeline = ({ selectedDate }: { selectedDate: Date }) => {
  const { users, currentUser } = useContext(UserContext);
  const { tasks, calendarEvents } = useContext(DataContext);
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const isResizing = useRef<string | null>(null);
  const initialX = useRef<number>(0);
  
  const dayKey = useMemo(() => format(selectedDate, 'EEEE', { locale: enUS }), [selectedDate]);
  const dayIndex = useMemo(() => getDay(selectedDate), [selectedDate]);

  const tasksForDay = useMemo(() => {
    return tasks.filter(t => {
      if (t.status === 'archived') return false;

      if (t.startDate) {
        const taskStartDate = new Date(t.startDate);
        const taskEndDate = t.endDate ? new Date(t.endDate) : new Date(8640000000000000);
        if (!isWithinInterval(selectedDate, { start: taskStartDate, end: taskEndDate })) {
          return false;
        }
        if (t.days && t.days.length > 0) {
          const taskDayIndices = t.days.map(d => (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(d) + 1) % 7);
          return taskDayIndices.includes(dayIndex);
        } else {
            return isSameDay(taskStartDate, selectedDate);
        }
      }
      return false;
    });
  }, [tasks, selectedDate, dayIndex]);

  const usersForDay = useMemo(() => {
    console.debug('usersForDay', users);
    return users.filter(user => {
      const workDay = user.workHours[dayKey];
      const hasTasks = tasksForDay.some(t => t.userId === user.id);
      return workDay?.active || hasTasks;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [users, tasksForDay, dayKey]);
  
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
    const shifts = [
        { start: '08:00', end: '13:00' },
        { start: '18:00', end: '22:30' }
    ];

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
            const workDay = user.workHours[dayKey as keyof typeof user.workHours];
            if (workDay?.active && workDay.start && workDay.end) {
                if (slotMinutes >= timeToMinutes(workDay.start) && slotMinutes < timeToMinutes(workDay.end)) {
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
    <div className="relative h-full w-full flex flex-col">
       <div className="sticky top-0 z-20 bg-background">
        <div className="grid" style={{ gridTemplateColumns }}>
          {/* Header section */}
          <div className="h-28 p-2 text-center border-b border-r"></div>
          <div className="h-28 p-2 text-center border-b border-r"></div>
          {usersForDay.map(user => (
            <div key={user.id} className="h-28 flex flex-col items-center justify-center p-2 text-center border-b border-r relative">
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
         {eventsForDay.length > 0 && (
           <div className="sticky top-[112px] z-20 bg-background">
              <div className="grid" style={{ gridTemplateColumns }}>
                  <div className="col-span-full bg-accent/50 border-y p-2 text-center font-semibold text-accent-foreground">
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
      <div className="overflow-auto">
        <div className="grid" style={{ gridTemplateColumns, position: 'relative' }}>
          <div className="sticky left-0 z-10 bg-background"><TimeRuler activeSlots={activeSlots}/></div>
          <div className="sticky left-[60px] z-10 bg-background"><ShiftColumn totalHeight={totalHeight} activeSlots={activeSlots}/></div>
          {usersForDay.map(user => {
            const userTasks = tasksForDay.filter(t => t.userId === user.id);
            return (
              <UserColumn key={user.id} user={user} currentUser={currentUser} tasksForDay={userTasks} selectedDate={selectedDate} activeSlots={activeSlots} totalHeight={totalHeight} />
            )
          })}
        </div>
      </div>
    </div>
  );
};


export default function TimelinePage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { users } = useContext(UserContext);
  const { tasks, calendarEvents, novelties } = useContext(DataContext);
  const [isClient, setIsClient] = useState(false);

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
  
  const activeNovelties = useMemo(() => {
    if (!selectedDate) return [];
    return novelties.filter(n => 
        isWithinInterval(selectedDate, { start: new Date(n.start), end: new Date(n.end) })
    );
  }, [novelties, selectedDate]);

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
    <div className="flex h-full flex-col">
       <div className="flex flex-wrap items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold font-headline">Cronograma Diario</h1>
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant={'link'} className="p-0 h-auto justify-start text-muted-foreground capitalize">
                       <h2 className="text-xl font-semibold">
                         {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : <span>Seleccionar fecha</span>}
                       </h2>
                       <CalendarIcon className="ml-2 h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={es}
                    />
                </PopoverContent>
            </Popover>
          </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={() => setSelectedDate(new Date())}>Hoy</Button>
                <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <Link href={`/admin?from=/timeline&date=${format(selectedDate, 'yyyy-MM-dd')}`}>
            <Button><PlusCircle className="mr-2 h-4 w-4" />Crear Tarea</Button>
        </Link>
      </div>
      {activeNovelties.length > 0 && (
        <div className="mb-4 space-y-2">
            {activeNovelties.map(novelty => (
                <Alert key={novelty.id} className="bg-blue-50 border-blue-200">
                    <Megaphone className="h-4 w-4 !text-blue-600" />
                    <AlertTitle className="text-blue-800">{novelty.title}</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        {novelty.description}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
       )}
      <Card className="flex-grow flex flex-col">
        <CardContent className="p-0 flex-grow relative overflow-hidden flex flex-col">
            {selectedDate && <DailyTimeline selectedDate={selectedDate} />}
        </CardContent>
      </Card>
    </div>
  );
}
