'use client';

import React from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Task, User } from '@/types';
import { cn } from '@/lib/utils';
import {  PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/task-card';
import { allTimeSlots, SLOT_HEIGHT, COLLAPSED_SLOT_HEIGHT, shifts } from './constants';


const timeToMinutes = (time: string): number => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

export const UserColumn = ({ user, currentUser, tasksForDay, selectedDate, activeSlots, totalHeight, onAddTask, onDragStart, onDragOver, onDragLeave, onDrop, dragOverTarget, canManageTasks }: { user: User, currentUser: User | null, tasksForDay: Task[], selectedDate: Date, activeSlots: { [key: string]: boolean }, totalHeight: number, onAddTask: (date: Date, userId: string) => void, onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void, onDragOver: (e: React.DragEvent<HTMLDivElement>, userId: string, date: Date) => void, onDragLeave: () => void, onDrop: (e: React.DragEvent<HTMLDivElement>, userId: string, date: Date) => void, dragOverTarget: { userId: string, date: Date } | null, canManageTasks: boolean }) => {
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
          // Only calculate positioning if user has specific start/end times
          if (workDay.start && workDay.end) {
            if (slotMinutes < timeToMinutes(workDay.start)) {
              top += slotHeight;
            } else if (slotMinutes <= timeToMinutes(workDay.end)) {
              calculatedHeight += slotHeight;
            }
          } else {
            // For users without specific times, use full shift coverage
            if (slotMinutes < timeToMinutes(shifts[0].start)) {
              top += slotHeight;
            } else if (slotMinutes <= timeToMinutes(shifts[1].end)) {
              calculatedHeight += slotHeight;
            }
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
                <div className="text-xs font-semibold opacity-70 mb-2" style={{color: user.color}}>
                  {workDay.start && workDay.end ? `${workDay.start} - ${workDay.end}` : 'Horario Completo'} ({workDay.virtual ? 'Virtual' : 'Presencial'})
                </div>
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