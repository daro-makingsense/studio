'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { userService } from '@/lib/supabase-service';
import type { User } from '@/types';
import { useSession } from 'next-auth/react';

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

  const { data: session, status } = useSession()

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

  useEffect(() => {
    if (session?.user?.id && users.length > 0) {
      const user = users.find(u => u.id === session.user.id) || null;
      setCurrentUser(user);
    } else if (!session?.user?.id) {
      // Clear current user if no session
      setCurrentUser(null);
    }
  }, [session, users]);
  
  const updateUserList = (updater: User[] | ((prevState: User[]) => User[])) => {
    setUsers(updater);
  };

  return (
    <UserContext.Provider value={{ users, setUsers: updateUserList, currentUser, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};
