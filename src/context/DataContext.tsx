'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { taskService, calendarEventService, noveltyService } from '@/lib/supabase-service';
import type { Task, CalendarEvent, Novelty } from '@/types';

type DataContextType = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => void;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addCalendarEvent: (event: CalendarEvent) => void;
  novelties: Novelty[];
  setNovelties: React.Dispatch<React.SetStateAction<Novelty[]>>;
  addNovelty: (novelty: Novelty) => void;
  updateNovelty: (novelty: Novelty) => void;
  deleteNovelty: (noveltyId: string) => void;
  markNoveltyAsViewed: (noveltyId: string, userId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  refreshData: () => void;
};




export const DataContext = createContext<DataContextType>({
  tasks: [],
  setTasks: () => {},
  addTask: () => {},
  updateTask: () => Promise.resolve(),
  deleteTask: () => {},
  calendarEvents: [],
  setCalendarEvents: () => {},
  addCalendarEvent: () => {},
  novelties: [],
  setNovelties: () => {},
  addNovelty: () => {},
  updateNovelty: () => {},
  deleteNovelty: () => {},
  markNoveltyAsViewed: () => Promise.resolve(),
  loading: true,
  error: null,
  refreshData: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [novelties, setNovelties] = useState<Novelty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  const addTask = async (task: Task) => {
    try {
      const newTask = await taskService.create(task);
      console.log('New task:', newTask);
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
    try {
      const created = await noveltyService.create(novelty);
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

  const deleteNovelty = async (noveltyId: string) => {
    try {
      await noveltyService.delete(noveltyId);
      setNovelties(currentNovelties => currentNovelties.filter(n => n.id !== noveltyId));
    } catch (error) {
      console.error('Error deleting novelty:', error);
      throw error; // Propagate error to caller
    }
  };

  const markNoveltyAsViewed = async (noveltyId: string, userId: string) => {
    try {
      const updated = await noveltyService.markAsViewed(noveltyId, userId);
      setNovelties(currentNovelties => currentNovelties.map(n => n.id === noveltyId ? updated : n));
    } catch (error) {
      console.error('Error marking novelty as viewed:', error);
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
        deleteNovelty,
        markNoveltyAsViewed,
        loading,
        error,
        refreshData: loadData,
    }}>
      {children}
    </DataContext.Provider>
  );
};
