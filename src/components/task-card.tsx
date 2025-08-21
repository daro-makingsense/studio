'use client';

import React, { useContext } from 'react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { DataContext } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
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
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
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
};

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
        <Button variant="ghost" size="sm" className="flex items-center gap-2 ml-auto -mr-2 hover:bg-transparent hover:text-foreground">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[task.status] }} />
          <span className="text-xs font-semibold">{statusMap[task.status]}</span>
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

interface TaskCardProps {
  task: Task;
  canChangeStatus: boolean;
  variant?: 'canvas' | 'timeline';
  // Canvas-specific props
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  canManageTasks?: boolean;
}

export function TaskCard({ 
  task, 
  canChangeStatus, 
  variant = 'timeline',
  draggable = false,
  onDragStart,
  canManageTasks = false
}: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart) {
      onDragStart(e, task.id);
    }
  };

  const baseClasses = cn(
    'relative p-3 flex flex-col transition-all', 
    priorityClasses[task.priority],
    task.status === 'done' && 'opacity-60'
  );

  const variantClasses = {
    canvas: cn(
      baseClasses,
      'rounded-md shadow-lg',
      draggable && canManageTasks ? 'cursor-grab active:cursor-grabbing hover:shadow-xl' : 'cursor-default'
    ),
    timeline: cn(
      baseClasses,
      'rounded-lg shadow-lg',
      draggable && canManageTasks ? 'cursor-grab active:cursor-grabbing hover:shadow-xl' : 'cursor-default'
    )
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      className={variantClasses[variant]}
      style={{ borderTop: `10px solid ${priorityBarClasses[task.priority]}` }}
    >
      <h4 className={cn("font-bold text-sm mb-1 pb-1 border-b border-black/10", task.status === 'done' && 'line-through')}>
        {task.title}
      </h4>
      
      {task.startTime && (
        <p className="text-xs font-semibold text-gray-800/90">
          {task.startTime} {task.duration && `- (${task.duration} m)`}
        </p>
      )}
      
      {variant === 'canvas' && task.description && (
        <p className="flex-grow text-xs text-gray-800/90 overflow-auto">{task.description}</p>
      )}
      
      <div className="mt-auto pt-1 flex items-center justify-between text-xs text-gray-600/90">
        <span className={cn("font-bold", priorityTextColor[task.priority])}>
          {priorityText[task.priority]}
        </span>   
        <TaskStatusChanger task={task} canChangeStatus={canChangeStatus} />
      </div>
    </div>
  );
}