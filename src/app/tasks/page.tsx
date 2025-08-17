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
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DataContext } from '@/context/DataContext';
import { UserContext } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';


const priorityVariant = {
  low: 'secondary',
  medium: 'outline',
  high: 'destructive',
} as const;

const statusVariant = {
  todo: 'outline',
  'in-progress': 'default',
  done: 'secondary',
  archived: 'ghost',
} as const;

const dayMap: { [key: string]: string } = {
    Monday: 'Lunes',
    Tuesday: 'Martes',
    Wednesday: 'Miércoles',
    Thursday: 'Jueves',
    Friday: 'Viernes',
    Saturday: 'Sábado',
    Sunday: 'Domingo',
};

const statusMap: { [key: string]: string } = {
    todo: 'Por hacer',
    'in-progress': 'En progreso',
    done: 'Hecho',
};


function SimpleTasksTable({ tasks }: { tasks: Task[] }) {
    const { users } = useContext(UserContext);
    
    if (tasks.length === 0) {
        return (
            <div className="h-24 text-center flex justify-center items-center">
                No se encontraron tareas con los filtros actuales.
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Asignado a</TableHead>
                <TableHead>Programación</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                        <div className="font-bold">{task.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">{task.description}</div>
                    </TableCell>
                    <TableCell>{users.find((u) => u.id === task.userId)?.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                          {task.startDate ? (
                            <Badge variant="outline">
                                {task.endDate ? 
                                    `Del ${format(new Date(task.startDate), 'd/MM/yy')} al ${format(new Date(task.endDate), 'd/MM/yy')}`
                                    : `Desde ${format(new Date(task.startDate), 'd MMM yyyy')}`
                                }
                            </Badge>
                          ) : null}
                          {task.days && task.days.length > 0 && <div className="flex gap-1 flex-wrap">{task.days.map(d => <Badge variant="secondary" key={d}>{dayMap[d]}</Badge>)}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[task.priority]} className="capitalize">
                        {task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : 'Alta'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[task.status as keyof typeof statusVariant]} className="capitalize">
                        {statusMap[task.status as keyof typeof statusMap]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
    )
}

function SimpleTasksManager() {
  const { tasks } = useContext(DataContext);
  const { users } = useContext(UserContext);
  const [filters, setFilters] = useState({
    user: 'all',
    status: 'all',
    searchTerm: '',
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredTasks = useMemo(() => {
    // Only show active tasks in this simple view
    return tasks.filter((task) => {
      if (task.status === 'archived') return false;
      const userMatch = filters.user === 'all' || task.userId === filters.user;
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const searchMatch =
        filters.searchTerm === '' ||
        task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      return userMatch && statusMatch && searchMatch;
    });
  }, [tasks, filters]);


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  
  if (!isClient) {
    return <Card><CardHeader><CardTitle>Cargando Tareas...</CardTitle></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div>
            <CardTitle>Listado de Tareas</CardTitle>
            <CardDescription>
                Consulte y filtre todas las tareas activas.
            </CardDescription>
        </div>
        <div className="mt-4 flex flex-col md:flex-row gap-2">
            <Input
            placeholder="Buscar por título o descripción..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="max-w-sm"
            />
            <Select
            value={filters.user}
            onValueChange={(value) => handleFilterChange('user', value)}
            >
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por usuario" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Usuarios</SelectItem>
                {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                    {user.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>

            <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
            >
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="todo">Por hacer</SelectItem>
                <SelectItem value="in-progress">En progreso</SelectItem>
                <SelectItem value="done">Hecho</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
          <SimpleTasksTable tasks={filteredTasks} />
      </CardContent>
    </Card>
  );
}

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function TasksPage() {
    return (
        <div className="container mx-auto py-10">
             <h1 className="text-3xl font-bold font-headline mb-6">Tareas</h1>
            <SimpleTasksManager />
        </div>
    )
}
