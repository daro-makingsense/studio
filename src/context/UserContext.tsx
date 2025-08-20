'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { userService } from '@/lib/supabase-service';
import type { DaysOfWeek, Task, User, WorkDay } from '@/types';
import { Position } from 'postcss';

const currentUserId = 'user-1'; 

type UserContextType = {
  users: User[];
  setUsers: (users: User[] | ((prevState: User[]) => User[])) => void;
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
};


export const UserContext = createContext<UserContextType>({
  users: [],
  setUsers: () => {},
  currentUser: null,
  loading: true,
  error: null,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load users from Supabase on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const supabaseUsers = await userService.getAll();
        setUsers(supabaseUsers);
        setError(null);
      } catch (err) {
        console.error('Error loading users from Supabase:', err);
        setError(err as Error);
        // Keep empty array if Supabase fails - no fallback to mocked data
        setUsers([]);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Update current user whenever users change
  useEffect(() => {
    const user = users.find(u => u.id === currentUserId) || null;
    setCurrentUser(user);
  }, [users]);

  // Save to Supabase whenever users change (after initialization)
  // useEffect(() => {
  //   if (!initialized || users.length === 0) return;

  //   const saveUsers = async () => {
  //     try {
  //       await userService.upsertMany(users);
  //     } catch (error) {
  //       console.error('Error saving users to Supabase:', error);
  //     }
  //   };

  //   saveUsers();
  // }, [users, initialized]);
  
  const updateUserList = (updater: User[] | ((prevState: User[]) => User[])) => {
    setUsers(updater);
  };

  return (
    <UserContext.Provider value={{ users, setUsers: updateUserList, currentUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};
