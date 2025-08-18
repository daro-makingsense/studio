'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { users as initialUsers } from '@/lib/data';
import { userService } from '@/lib/supabase-service';
import type { User } from '@/types';

const currentUserId = 'user-1'; 

type UserContextType = {
  users: User[];
  setUsers: (users: User[] | ((prevState: User[]) => User[])) => void;
  currentUser: User | null;
  loading: boolean;
};


export const UserContext = createContext<UserContextType>({
  users: [],
  setUsers: () => {},
  currentUser: null,
  loading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load users from Supabase on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const supabaseUsers = await userService.getAll();
        
        // If no users exist in Supabase, initialize with default data
        if (supabaseUsers.length === 0) {
          await userService.upsertMany(initialUsers);
          setUsers(initialUsers);
        } else {
          setUsers(supabaseUsers);
        }
      } catch (error) {
        console.error('Error loading users from Supabase:', error);
        // Fallback to initial users if Supabase fails
        setUsers(initialUsers);
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
  useEffect(() => {
    if (!initialized || users.length === 0) return;

    const saveUsers = async () => {
      try {
        await userService.upsertMany(users);
      } catch (error) {
        console.error('Error saving users to Supabase:', error);
      }
    };

    saveUsers();
  }, [users, initialized]);
  
  const updateUserList = (updater: User[] | ((prevState: User[]) => User[])) => {
    setUsers(updater);
  };

  return (
    <UserContext.Provider value={{ users, setUsers: updateUserList, currentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
