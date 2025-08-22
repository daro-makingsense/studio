'use client';

import React, { useContext, useState, useCallback, useEffect } from 'react';
import { addDays, subDays, format, getDay, nextMonday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { UserContext } from '@/context/UserContext';
import { DataContext } from '@/context/DataContext';
import type { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateTaskModal from '@/components/create-task-modal';
import NoveltyBanner from '@/components/novelty-banner';
import { DailyTimeline } from './timeline';



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
            const dayString = format(date, 'yyyy-MM-dd');
            // Use string comparison for date range check to avoid timezone issues
            const taskEndDate = t.endDate || '9999-12-31'; // Use far future date if no end date
            if (!(dayString >= t.startDate && dayString <= taskEndDate)) return false;
            
            if (t.days && t.days.length > 0) {
                const taskDayIndices = t.days.map(d => (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(d) + 1) % 7);
                return taskDayIndices.includes(dayIndex);
            } else {
                return dayString === t.startDate;
            }
        }
        return false;
    });
    const hasEvents = calendarEvents.some(e => {
      const dayString = format(date, 'yyyy-MM-dd');
      return dayString >= e.start && dayString <= e.end;
    });
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
