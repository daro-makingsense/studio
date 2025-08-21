'use client';

import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Task, User, Novelty } from '@/types';
import { Download, PlusCircle, Edit, Calendar as CalendarIcon, Trash2, Archive, User as UserIcon, Lock, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { DataContext } from '@/context/DataContext';
import { UserContext } from '@/context/UserContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import UsersManager from '@/components/users-manager';
import NoveltiesManager from '@/components/novelties-manager';
import { useSession } from 'next-auth/react';



export default function AdminPage() {
    const { currentUser } = useContext(UserContext);
    const { data: session, status } = useSession()

    if (status === 'loading') return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
    
    if (session && session.user && !(session.user.role === 'admin' || session.user.role === 'owner')) {
      return (
        <div className="container mx-auto py-10 flex flex-col items-center justify-center text-center">
            <Lock className="h-16 w-16 text-destructive mb-4"/>
            <h1 className="text-3xl font-bold font-headline">Acceso Denegado</h1>
            <p className="text-lg text-muted-foreground mt-2">
                No tienes los permisos necesarios para acceder a esta sección.
            </p>
        </div>
      )
    }

    const canAccessAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    return (
        <div className="container mx-auto py-10">
             <h1 className="text-3xl font-bold font-headline mb-6">Panel de Administración</h1>
             <Tabs defaultValue="users">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    {/* <TabsTrigger value="tasks">Gestionar Tareas</TabsTrigger> */}
                    <TabsTrigger value="users">Gestionar Usuarios</TabsTrigger>
                    <TabsTrigger value="novelties">Gestionar Novedades</TabsTrigger>
                </TabsList>
                 {/* <TabsContent value="tasks">
                    <TasksManager />
                </TabsContent> */}
                <TabsContent value="users">
                    <UsersManager canManageUsers={canAccessAdmin} />
                </TabsContent>
                <TabsContent value="novelties">
                    <NoveltiesManager canManageNovelties={canAccessAdmin} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
