'use client';

import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DaysOfWeek, Task, User } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, PlusCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Megaphone, Ellipsis } from 'lucide-react';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isWithinInterval, endOfWeek, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateTaskModal from '@/components/create-task-modal';

const priorityClasses = {
  high: 'bg-red-100',
  medium: 'bg-yellow-100',
  low: 'bg-green-100',
};

const priorityBarClasses = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

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

const priorityOrder = { high: 1, medium: 2, low: 3 };

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

const TaskStatusChanger = ({ task, canChangeStatus }: { task: Task; canChangeStatus: boolean }) => {
  const { updateTask } = useContext(DataContext);
  const statuses = ['todo', 'in-progress', 'done'];

  if (!canChangeStatus) {
    return (
      <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[task.status] }} />
          <span className="text-xs font-semibold">{statusMap[task.status]}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 -ml-2">
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


export default function UserAgendaPage() {
  const { users, currentUser } = useContext(UserContext);
  const { tasks, updateTask, calendarEvents, novelties, refreshData } = useContext(DataContext);
  const [selectedUser, setSelectedUser] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ userId: string, day: string, date: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState<Date>();

  useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    setCurrentDate(new Date());
  }, []);

  const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const daysOfWeek = useMemo(() => {
    if (!currentDate) return [];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const activeNovelties = useMemo(() => {
    if (!currentDate) return [];
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    return novelties.filter(n => {
        const noveltyInterval = { start: new Date(n.start), end: new Date(n.end) };
        const weekInterval = { start: weekStart, end: weekEnd };

        // Check for overlap between novelty interval and week interval
        return noveltyInterval.start <= weekInterval.end && noveltyInterval.end >= weekInterval.start;
    });
  }, [novelties, currentDate]);


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    if (!canManageTasks) return;
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, userId: string, day: string, date: Date) => {
    e.preventDefault();
    if (!canManageTasks) return;
    setDragOverTarget({ userId, day, date });
  };

  const handleDragLeave = () => setDragOverTarget(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetUserId: string, targetDay: string, targetDate: Date) => {
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
  
  if (!currentDate) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Cargando agenda...</p>
      </div>
    );
  }

  const weekStart = format(daysOfWeek[0], 'd MMM', { locale: es });
  const weekEnd = format(daysOfWeek[4], 'd MMM', { locale: es });

  return (
    <div className="flex h-full flex-col">
       <div className="flex flex-col md:flex-row items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">Agenda Semanal</h1>
          
          {/* pagination */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-semibold text-muted-foreground capitalize">{weekStart} - {weekEnd}</span>
        </div>
        
        {/* user selector */}
        <div className="flex items-center space-x-4">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ver todos los usuarios</SelectItem>
              {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* novelties */}
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
      {/* tasks for week */}
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {daysOfWeek.map(date => {
            const dayName = format(date, 'EEEE', { locale: enUS });
            const spanishDayName = format(date, 'EEEE', { locale: es });
            const usersForDay = users.filter(user => user.workHours[dayName].active || user.workHours[dayName].virtual);
            
            const eventsForDay = calendarEvents.filter(event => isWithinInterval(date, { start: new Date(event.start), end: new Date(event.end) }));
            
            return (
              <div key={date.toString()} className="flex flex-col gap-4 border-r-4 border-foreground/20 last:border-r-0 px-2">
                
                {/* day header */}
                <div className="text-center sticky top-0 bg-background py-2">
                    <h2 className="text-xl font-bold font-headline capitalize">
                    {spanishDayName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{format(date, 'd/M')}</p>
                </div>
                
                {/* events for day */}
                 {eventsForDay.length > 0 && (
                    <div className="space-y-2">
                        {eventsForDay.map(event => (
                            <div key={event.id} className="flex items-center gap-2 p-2 rounded-md bg-accent/50 text-accent-foreground text-sm">
                                <CalendarIcon className="h-4 w-4 shrink-0" />
                                <span className="font-semibold truncate">{event.title}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* users and tasks for day */}
                <div className="flex flex-col gap-4">
                  {usersForDay.length > 0 ? usersForDay.map(user => {
                    const workDay = user.workHours?.[dayName as keyof User['workHours']];
                    
                    const userTasks = tasks.filter(task => {
                      if (task.userId === user.id) {
                        // tareas asignadas para el dia
                        if (task.days && task.days.length > 0) {
                          return task.days.includes(dayName as DaysOfWeek);
                        }
                        // sacar tareas completadas si ya paso el deadline
                        if (task.status === 'done' && task.endDate && date > new Date(task.endDate)) return false;
                        
                        return date >= new Date(task.startDate);
                      };
                    });

                    const isDropTarget = dragOverTarget?.userId === user.id && dragOverTarget.day === dayName;

                    return (
                      <Card 
                        key={user.id} 
                        onDragOver={(e) => handleDragOver(e, user.id, dayName, date)}
                        onDrop={(e) => handleDrop(e, user.id, dayName, date)}
                        onDragLeave={handleDragLeave}
                        className={cn("flex-1 border-4 transition-colors duration-200", isDropTarget && "bg-primary/20")}
                        style={{ borderColor: user.color, backgroundColor: workDay?.virtual ? `${user.color}1A` : undefined }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderBottomColor: user.color }}>
                            <UserIcon className="h-5 w-5" style={{ color: user.color }}/>
                            <div>
                              <h3 className="font-semibold">{user.name}</h3>
                              {user.positions.length > 0 && (<p className="text-xs text-muted-foreground">{user.positions.map(p => p.shortName).join(' / ')}</p>)}
                            </div>
                            {workDay.active && (<p className="text-xs text-muted-foreground ml-auto">{workDay.start} - {workDay.end}</p>)}
                            {workDay.virtual && (<p className="text-xs text-muted-foreground ml-auto">Virtual</p>)}
                          </div>
                          <div className="space-y-3 p-2 min-h-[50px]">
                            {userTasks.length > 0 ? userTasks.map(task => {
                                const canChangeStatus = canManageTasks || currentUser?.id === task.userId;
                                // task card
                                return (
                                  <div
                                    key={task.id}
                                    draggable={canManageTasks}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className={cn(
                                      'relative p-3 flex flex-col rounded-md shadow-lg transition-all', 
                                      canManageTasks ? 'cursor-grab active:cursor-grabbing' : 'cursor-default', 
                                      priorityClasses[task.priority],
                                      task.status === 'done' && 'opacity-60'
                                    )}
                                    style={{ borderTop: `10px solid ${priorityBarClasses[task.priority]}` }}
                                  >
                                    <h4 className={cn("font-bold text-sm mb-1 pb-1 border-b border-black/10", task.status === 'done' && 'line-through')}>{task.title}</h4>
                                    <p className="flex-grow text-xs text-gray-800/90 overflow-auto">{task.description}</p>
                                    <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-600/90">
                                      <span>{task.startTime ? `${task.startTime} (${task.duration}m)` : <span className={cn("font-bold", priorityTextColor[task.priority])}>{priorityText[task.priority]}</span>}</span>
                                       <TaskStatusChanger task={task} canChangeStatus={canChangeStatus} />
                                    </div>
                                  </div>
                                );
                              }) : (
                                <div className="flex flex-col items-center justify-center text-center h-full pt-4">
                                    <p className="text-xs text-muted-foreground">
                                        {workDay?.active ? 'Disponible para tareas' : 'Sin tareas asignadas'}
                                    </p>
                                    
                                </div>
                              )}
                          </div>
                          {canManageTasks && (
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => {
                                setIsTaskModalOpen(true);
                                setTaskStartDate(date);
                              }}>
                                <PlusCircle className="mr-2 h-3 w-3" />
                                Agregar Tarea
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  }) : (
                    <div className="text-center text-sm text-muted-foreground pt-8">
                      Nadie asignado este día.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <CreateTaskModal closeDialog={() => setIsTaskModalOpen(false)} startDate={taskStartDate}/>
        </DialogContent>
      </Dialog>
    </div>
  );
}
