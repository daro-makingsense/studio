'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { 
    tasks as initialTasks, 
    calendarEvents as initialCalendarEvents, 
    novelties as initialNovelties 
} from '@/lib/data';
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

// Helper para guardar en localStorage
function saveToStorage<T>(key: string, data: T) {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(data, (k, v) => {
            // No es necesario un replacer para fechas si usamos ISO strings
            return v;
        }));
    }
}

// Helper para cargar desde localStorage
function loadFromStorage<T>(key: string, initialData: T): T {
    if (typeof window === 'undefined') {
        return initialData;
    }
    const stored = window.localStorage.getItem(key);
    if (stored) {
        try {
            // Reviver para convertir ISO strings a objetos Date
            return JSON.parse(stored, (k, v) => {
                if (['startDate', 'endDate', 'start', 'end', 'updatedAt'].includes(k) && typeof v === 'string' && v.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                    return v; // Mantener como string ISO, los componentes lo manejarán
                }
                return v;
            });
        } catch (e) {
            console.error(`Error parsing ${key} from localStorage`, e);
            return initialData;
        }
    }
    return initialData;
}


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
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', initialTasks));
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadFromStorage('calendarEvents', initialCalendarEvents));
  const [novelties, setNovelties] = useState<Novelty[]>(() => loadFromStorage('novelties', initialNovelties));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveToStorage('tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    saveToStorage('calendarEvents', calendarEvents);
  }, [calendarEvents]);

  useEffect(() => {
    saveToStorage('novelties', novelties);
  }, [novelties]);
  
  useEffect(() => {
    // Simulamos la carga para que el layout se muestre
    setLoading(false);
  }, []);

  const addTask = (task: Task) => {
    setTasks(prevTasks => [...prevTasks, task]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
  };
  
  const addCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents(prevEvents => [...prevEvents, event]);
  };
  
  const addNovelty = (novelty: Novelty) => {
      setNovelties(prevNovelties => [...prevNovelties, {...novelty, id: `novelty-${Date.now()}`, updatedAt: new Date().toISOString()}]);
  }

  const updateNovelty = (updatedNovelty: Novelty) => {
    setNovelties(currentNovelties => currentNovelties.map(n => n.id === updatedNovelty.id ? {...updatedNovelty, updatedAt: new Date().toISOString()} : n));
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
