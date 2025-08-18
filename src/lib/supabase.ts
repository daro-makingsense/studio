import { createClient } from '@supabase/supabase-js';
import type { User, Task, CalendarEvent, Novelty } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: User;
        Update: Partial<User>;
      };
      tasks: {
        Row: Task;
        Insert: Task;
        Update: Partial<Task>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: CalendarEvent;
        Update: Partial<CalendarEvent>;
      };
      novelties: {
        Row: Novelty;
        Insert: Novelty;
        Update: Partial<Novelty>;
      };
    };
  };
}