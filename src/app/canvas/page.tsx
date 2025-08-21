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
import type { DaysOfWeek, Task, User } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, PlusCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays, subWeeks, addWeeks, isWithinInterval, endOfWeek, isSameDay } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateTaskModal from '@/components/create-task-modal';
import NoveltyBanner from '@/components/novelty-banner';
import { TaskCard } from '@/components/task-card';

const priorityOrder = { high: 1, medium: 2, low: 3 };




export default function UserAgendaPage() {
  const { users, currentUser } = useContext(UserContext);
  const { tasks, updateTask, calendarEvents, novelties, markNoveltyAsViewed, refreshData } = useContext(DataContext);
  const [selectedUser, setSelectedUser] = useState('all');
  const [taskModalUserId, setTaskModalUserId] = useState<string>('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ userId: string, day: string, date: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskStartDate, setTaskStartDate] = useState<Date>();

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const canManageTasks = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const daysOfWeek = useMemo(() => {
    if (!currentDate) return [];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }).map((_, i) => addDays(start, i));
  }, [currentDate]);




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
       {/* Header with just title */}
       <div className="pb-4">
         <h1 className="text-3xl font-bold font-headline">Agenda Semanal</h1>
       </div>
      
      {/* novelties */}
      <NoveltyBanner 
        novelties={novelties} 
        currentDate={currentDate} 
        currentUser={currentUser}
        onDismiss={markNoveltyAsViewed}
        mode="week" 
      />
      
      {/* Navigation and user selector on same line */}
      <div className="flex items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="bg-white shadow-sm border-gray-300 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-semibold capitalize px-4">{weekStart} - {weekEnd}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="bg-white shadow-sm border-gray-300 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* user selector */}
        <div className="flex items-center">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px] bg-white border-gray-300 shadow-sm"><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ver todos los usuarios</SelectItem>
              {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
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
                  {usersForDay.length > 0 ? usersForDay.filter(user => selectedUser === 'all' || user.id === selectedUser).map(user => {
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
                      }
                      return false;
                    }).sort((a,b) => {
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
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
                                return (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    canChangeStatus={canChangeStatus}
                                    variant="canvas"
                                    draggable={canManageTasks}
                                    onDragStart={handleDragStart}
                                    canManageTasks={canManageTasks}
                                  />
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
                                setTaskModalUserId(user.id);
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <CreateTaskModal 
            startDate={taskStartDate}
            userId={taskModalUserId}
            closeDialog={() => setIsTaskModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
