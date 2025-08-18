/**
 * WARNING: This file contains seed data for initial database setup ONLY.
 * DO NOT import or use this data directly in the application.
 * All data should be loaded from Supabase.
 * 
 * To seed the database, use: npm run db:insert-dummy-data
 */

import type { User, Task, CalendarEvent, Novelty } from '@/types';

// SEED DATA - DO NOT USE IN APPLICATION
export const users: User[] = [
    {
      id: 'user-1',
      name: 'Alejandra',
      positions: [{ fullName: 'Jefa de Trabajos Prácticos', shortName: 'JTP' }],
      role: 'owner',
      workHours: {
        Monday: { active: true, virtual: false, start: '16:00', end: '20:30' },
        Tuesday: { active: true, virtual: true },
        Wednesday: { active: true, virtual: false, start: '08:00', end: '20:30' },
        Thursday: { active: false, virtual: false },
        Friday: { active: false, virtual: false },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['Daily Standup', 'Code Review'],
      color: '#3b82f6',
    },
    {
      id: 'user-2',
      name: 'Patricia',
      positions: [{ fullName: 'Secretaría Académica', shortName: 'Sec. Académica' }],
      role: 'admin',
      workHours: {
        Monday: { active: true, virtual: false },
        Tuesday: { active: true, virtual: false },
        Wednesday: { active: true, virtual: false },
        Thursday: { active: true, virtual: false },
        Friday: { active: true, virtual: false },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['Client Meeting', 'Design Mockups'],
      color: '#10b981',
    },
    {
      id: 'user-3',
      name: 'Carolina',
      positions: [{ fullName: 'Analista QA', shortName: 'QA' }],
      role: 'user',
       workHours: {
        Monday: { active: false, virtual: false },
        Tuesday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Wednesday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Thursday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Friday: { active: false, virtual: false },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['QA Testing', 'Bug Triage'],
      color: '#f97316',
    },
    {
      id: 'user-4',
      name: 'Gabriela',
      positions: [{ fullName: 'Desarrolladora Backend', shortName: 'Backend Dev' }],
      role: 'user',
      workHours: {
        Monday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Tuesday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Wednesday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Thursday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Friday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['Documentation', 'Support Tickets'],
      color: '#8b5cf6',
    },
    {
      id: 'user-5',
      name: 'Antonella',
      positions: [{ fullName: 'Especialista en Marketing', shortName: 'Marketing' }],
      role: 'user',
      workHours: {
        Monday: { active: true, virtual: false, start: '18:00', end: '21:30' },
        Tuesday: { active: true, virtual: false, start: '18:00', end: '21:30' },
        Wednesday: { active: true, virtual: false, start: '18:00', end: '21:30' },
        Thursday: { active: false, virtual: false },
        Friday: { active: false, virtual: false },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['Marketing', 'Social Media'],
      color: '#ec4899',
    },
    {
      id: 'user-6',
      name: 'Marianela',
      positions: [{ fullName: 'Ejecutiva de Ventas', shortName: 'Ventas' }],
      role: 'user',
      workHours: {
        Monday: { active: true, virtual: false, start: '18:00', end: '22:00' },
        Tuesday: { active: true, virtual: false, start: '18:00', end: '22:00' },
        Wednesday: { active: true, virtual: false, start: '18:00', end: '22:00' },
        Thursday: { active: true, virtual: false, start: '18:00', end: '22:00' },
        Friday: { active: true, virtual: false, start: '18:00', end: '22:00' },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['Sales', 'Customer Outreach'],
      color: '#6366f1',
    },
    {
      id: 'user-7',
      name: 'Valentina',
      positions: [{ fullName: 'Coordinadora de Operaciones', shortName: 'Ops' }],
      role: 'user',
      workHours: {
        Monday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Tuesday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Wednesday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Thursday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Friday: { active: true, virtual: false, start: '09:00', end: '13:00' },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: ['Operations', 'Logistics'],
      color: '#f59e0b',
    },
     {
      id: 'user-8',
      name: 'Myriam',
      positions: [{ fullName: 'Desarrolladora Frontend', shortName: 'Frontend Dev' }],
      role: 'user',
      workHours: {
        Monday: { active: false, virtual: false },
        Tuesday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Wednesday: { active: false, virtual: false },
        Thursday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Friday: { active: true, virtual: false, start: '07:30', end: '11:30' },
        Saturday: { active: false, virtual: false },
        Sunday: { active: false, virtual: false },
      },
      frequentTasks: [],
      color: '#71717a',
    },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Preparar informe de seguimiento semanal',
    description: 'Recopilar datos de rendimiento y preparar la presentación para la reunión del lunes.',
    userId: 'user-1',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toISOString(), // Lunes de esta semana
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 'task-2',
    title: 'Revisión de contratos pendientes',
    description: 'Revisar y aprobar los contratos de nuevos clientes.',
    userId: 'user-2',
    days: ['Tuesday', 'Thursday'],
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 'task-3',
    title: 'Ejecutar plan de pruebas para v1.2',
    description: 'Realizar pruebas de regresión y de nuevas funcionalidades en el entorno de staging.',
    userId: 'user-3',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 2)).toISOString(), // Martes de esta semana
    startTime: '10:00',
    duration: 180,
    priority: 'high',
    status: 'todo',
  },
  {
    id: 'task-4',
    title: 'Desarrollar endpoint de autenticación',
    description: 'Implementar el nuevo endpoint de API para el login con JWT.',
    userId: 'user-4',
    days: ['Monday', 'Wednesday', 'Friday'],
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    priority: 'medium',
    status: 'in-progress',
  },
  {
    id: 'task-5',
    title: 'Diseñar campaña de redes sociales',
    description: 'Crear borradores para los posts de la próxima semana.',
    userId: 'user-5',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 4)).toISOString(), // Jueves de esta semana
    priority: 'low',
    status: 'todo',
  },
   {
    id: 'task-6',
    title: 'Llamadas de seguimiento a clientes',
    description: 'Contactar a los clientes potenciales de la lista A.',
    userId: 'user-6',
    days: ['Wednesday'],
    startDate: new Date().toISOString(),
    startTime: '18:30',
    duration: 90,
    priority: 'medium',
    status: 'done',
  },
   {
    id: 'task-7',
    title: 'Optimizar logística de envíos',
    description: 'Analizar rutas de entrega y buscar opciones más eficientes.',
    userId: 'user-7',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 5)).toISOString(), // Viernes de esta semana
    priority: 'low',
    status: 'todo',
  },
   {
    id: 'task-8',
    title: 'Maquetar nueva página de precios',
    description: 'Convertir el diseño de Figma a componentes de React.',
    userId: 'user-8',
    days: ['Friday'],
    startDate: new Date().toISOString(),
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 'task-9',
    title: 'Organizar reunión de equipo mensual',
    description: 'Agendar la reunión, preparar la agenda y enviar invitaciones.',
    userId: 'user-1',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 3)).toISOString(), // Miércoles de esta semana
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 'task-10',
    title: 'Actualizar documentación de la API',
    description: 'Documentar los nuevos endpoints y cambios en la v1.2.',
    userId: 'user-4',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 2)).toISOString(), // Martes de esta semana
    priority: 'low',
    status: 'done',
  },
  {
    id: 'task-11',
    title: 'Archivar facturas del mes anterior',
    description: 'Clasificar y archivar todas las facturas de proveedores y clientes.',
    userId: 'user-2',
    status: 'archived',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() -1, 1).toISOString(),
    priority: 'medium',
  }
];

export const calendarEvents: CalendarEvent[] = [
    {
        id: 'event-1',
        title: 'Feriado Nacional',
        start: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toISOString(), // Lunes de esta semana
        end: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toISOString(),
        type: 'blocker',
        description: 'Día no laborable por feriado nacional.'
    },
    {
        id: 'event-2',
        title: 'Semana de Mantenimiento de Servidores',
        start: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 4)).toISOString(), // Jueves de esta semana
        end: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 5)).toISOString(), // Viernes
        type: 'info',
        description: 'Posibles interrupciones breves del servicio durante la noche.'
    }
];

export const novelties: Novelty[] = [
    {
        id: 'novelty-1',
        title: '¡Nueva versión de la App disponible!',
        description: 'Hemos lanzado la versión 2.0 con mejoras de rendimiento y nuevas funcionalidades. Por favor, actualicen sus aplicaciones.',
        start: new Date().toISOString(),
        end: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // Vigente por una semana
    },
    {
        id: 'novelty-2',
        title: 'Recordatorio: Completar encuesta de clima laboral',
        description: 'No olviden completar la encuesta anual antes del viernes. Su feedback es muy importante.',
        start: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toISOString(), // Lunes de esta semana
        end: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 5)).toISOString(), // Viernes
    }
];
