'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { users as initialUsers } from '@/lib/data';
import type { User } from '@/types';

const currentUserId = 'user-1'; 

type UserContextType = {
  users: User[];
  setUsers: (users: User[] | ((prevState: User[]) => User[])) => void;
  currentUser: User | null;
  loading: boolean;
};

function saveUsersToStorage(users: User[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('users', JSON.stringify(users));
  }
}

function loadUsersFromStorage(): User[] {
  if (typeof window === 'undefined') {
    return initialUsers;
  }
  const storedUsers = window.localStorage.getItem('users');
  if (storedUsers) {
    try {
        return JSON.parse(storedUsers);
    } catch(e) {
        return initialUsers;
    }
  }
  return initialUsers;
}


export const UserContext = createContext<UserContextType>({
  users: [],
  setUsers: () => {},
  currentUser: null,
  loading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(loadUsersFromStorage);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveUsersToStorage(users);
    const user = users.find(u => u.id === currentUserId) || null;
    setCurrentUser(user);
    if(loading){
        setLoading(false);
    }
  }, [users, loading]);
  
  const updateUserList = (updater: User[] | ((prevState: User[]) => User[])) => {
    setUsers(updater);
  };

  return (
    <UserContext.Provider value={{ users, setUsers: updateUserList, currentUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
