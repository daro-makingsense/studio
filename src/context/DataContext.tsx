'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { 
    tasks as initialTasks, 
    calendarEvents as initialCalendarEvents, 
    novelties as initialNovelties 
} from '@/lib/data';
import { taskService, calendarEventService, noveltyService } from '@/lib/supabase-service';
import type { Task, CalendarEvent, Novelty } from '@/types';

type DataContextType = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addCalendarEvent: (event: CalendarEvent) => void;
  novelties: Novelty[];
  setNovelties: React.Dispatch<React.SetStateAction<Novelty[]>>;
  addNovelty: (novelty: Novelty) => void;
  updateNovelty: (novelty: Novelty) => void;
  loading: boolean;
};




export const DataContext = createContext<DataContextType>({
  tasks: [],
  setTasks: () => {},
  addTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
  calendarEvents: [],
  setCalendarEvents: () => {},
  addCalendarEvent: () => {},
  novelties: [],
  setNovelties: () => {},
  addNovelty: () => {},
  updateNovelty: () => {},
  loading: true,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [novelties, setNovelties] = useState<Novelty[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load all data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all data in parallel
        const [supabaseTasks, supabaseEvents, supabaseNovelties] = await Promise.all([
          taskService.getAll(),
          calendarEventService.getAll(),
          noveltyService.getAll()
        ]);

        // If no data exists, initialize with default data
        if (supabaseTasks.length === 0) {
          await taskService.upsertMany(initialTasks);
          setTasks(initialTasks);
        } else {
          setTasks(supabaseTasks);
        }

        if (supabaseEvents.length === 0) {
          await calendarEventService.upsertMany(initialCalendarEvents);
          setCalendarEvents(initialCalendarEvents);
        } else {
          setCalendarEvents(supabaseEvents);
        }

        if (supabaseNovelties.length === 0) {
          await noveltyService.upsertMany(initialNovelties);
          setNovelties(initialNovelties);
        } else {
          setNovelties(supabaseNovelties);
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        // Fallback to initial data if Supabase fails
        setTasks(initialTasks);
        setCalendarEvents(initialCalendarEvents);
        setNovelties(initialNovelties);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addTask = async (task: Task) => {
    try {
      const newTask = await taskService.create(task);
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (error) {
      console.error('Error adding task:', error);
      // Optimistically add to state even if Supabase fails
      setTasks(prevTasks => [...prevTasks, task]);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const updated = await taskService.update(updatedTask.id, updatedTask);
      setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updated : t));
    } catch (error) {
      console.error('Error updating task:', error);
      // Optimistically update state even if Supabase fails
      setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.delete(taskId);
      setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      // Optimistically delete from state even if Supabase fails
      setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
    }
  };
  
  const addCalendarEvent = async (event: CalendarEvent) => {
    try {
      const newEvent = await calendarEventService.create(event);
      setCalendarEvents(prevEvents => [...prevEvents, newEvent]);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      // Optimistically add to state even if Supabase fails
      setCalendarEvents(prevEvents => [...prevEvents, event]);
    }
  };
  
  const addNovelty = async (novelty: Novelty) => {
    const newNovelty = {...novelty, id: `novelty-${Date.now()}`, updatedAt: new Date().toISOString()};
    try {
      const created = await noveltyService.create(newNovelty);
      setNovelties(prevNovelties => [...prevNovelties, created]);
    } catch (error) {
      console.error('Error adding novelty:', error);
      // Optimistically add to state even if Supabase fails
      setNovelties(prevNovelties => [...prevNovelties, newNovelty]);
    }
  }

  const updateNovelty = async (updatedNovelty: Novelty) => {
    try {
      const updated = await noveltyService.update(updatedNovelty.id, updatedNovelty);
      setNovelties(currentNovelties => currentNovelties.map(n => n.id === updatedNovelty.id ? updated : n));
    } catch (error) {
      console.error('Error updating novelty:', error);
      // Optimistically update state even if Supabase fails
      setNovelties(currentNovelties => currentNovelties.map(n => n.id === updatedNovelty.id ? {...updatedNovelty, updatedAt: new Date().toISOString()} : n));
    }
  };

  return (
    <DataContext.Provider value={{
        tasks, 
        setTasks, 
        addTask, 
        updateTask, 
        deleteTask,
        calendarEvents,
        setCalendarEvents,
        addCalendarEvent,
        novelties,
        setNovelties,
        addNovelty,
        updateNovelty,
        loading
    }}>
      {children}
    </DataContext.Provider>
  );
};
