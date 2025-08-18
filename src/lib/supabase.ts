import { createClient } from '@supabase/supabase-js';
import { camelCase, mapKeys, snakeCase } from 'lodash';
import type { User, Task, CalendarEvent, Novelty } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) => {
      const newInit = { ...init };
      const { body } = newInit || {};
      if (body) {
        newInit.body = JSON.stringify(
          body,
          (key, value) => {
            if (value === null) {
              return undefined;
            }
            return value;
          },
        );
      }
      return fetch(input, newInit).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const camelCaseData = Array.isArray(data)
            ? data.map((item) => mapKeys(item, (value, key) => camelCase(key)))
            : mapKeys(data, (value, key) => camelCase(key));
          return new Response(JSON.stringify(camelCaseData), {
            ...res,
            headers: {
              ...res.headers,
              'Content-Type': 'application/json',
            },
          });
        }
        return res;
      });
    }
  }
});

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