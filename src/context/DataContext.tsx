'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
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
  error: Error | null;
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
  error: null,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [novelties, setNovelties] = useState<Novelty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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

        setTasks(supabaseTasks);
        setCalendarEvents(supabaseEvents);
        setNovelties(supabaseNovelties);
        setError(null);
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        setError(err as Error);
        // Keep empty arrays if Supabase fails - no fallback to mocked data
        setTasks([]);
        setCalendarEvents([]);
        setNovelties([]);
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
      throw error; // Propagate error to caller
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const updated = await taskService.update(updatedTask.id, updatedTask);
      setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updated : t));
    } catch (error) {
      console.error('Error updating task:', error);
      throw error; // Propagate error to caller
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.delete(taskId);
      setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error; // Propagate error to caller
    }
  };
  
  const addCalendarEvent = async (event: CalendarEvent) => {
    try {
      const newEvent = await calendarEventService.create(event);
      setCalendarEvents(prevEvents => [...prevEvents, newEvent]);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      throw error; // Propagate error to caller
    }
  };
  
  const addNovelty = async (novelty: Novelty) => {
    const newNovelty = {...novelty, id: `novelty-${Date.now()}`, updatedAt: new Date().toISOString()};
    try {
      const created = await noveltyService.create(newNovelty);
      setNovelties(prevNovelties => [...prevNovelties, created]);
    } catch (error) {
      console.error('Error adding novelty:', error);
      throw error; // Propagate error to caller
    }
  }

  const updateNovelty = async (updatedNovelty: Novelty) => {
    try {
      const updated = await noveltyService.update(updatedNovelty.id, updatedNovelty);
      setNovelties(currentNovelties => currentNovelties.map(n => n.id === updatedNovelty.id ? updated : n));
    } catch (error) {
      console.error('Error updating novelty:', error);
      throw error; // Propagate error to caller
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
        loading,
        error
    }}>
      {children}
    </DataContext.Provider>
  );
};
