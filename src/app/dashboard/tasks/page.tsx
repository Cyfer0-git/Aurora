'use client';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser, useFirestore } from '@/firebase';
import type { Task, User } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function TaskCard({ task, assignedBy }: { task: Task; assignedBy: User | undefined }) {
  const db = useFirestore();
  const [status, setStatus] = useState(task.status);
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length-1][0]}`;
    }
    return names[0].substring(0, 2);
  }
  
  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!db) return;
    setStatus(newStatus);
    const taskRef = doc(db, "tasks", task.id);
    updateDoc(taskRef, {
      status: newStatus
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: taskRef.path,
            operation: 'update',
            requestResourceData: { status: newStatus },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const dueDate = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : new Date(task.dueDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription className="mt-1">
                Due: {format(dueDate, 'PPP')}
                </CardDescription>
            </div>
            <Badge
            variant={
                status === 'Done'
                ? 'default'
                : status === 'In Progress'
                ? 'secondary'
                : 'outline'
            }
            className={cn(status === 'Done' && 'bg-green-600 hover:bg-green-700')}
            >
            {status}
            </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{task.description}</p>
        <div className="flex justify-between items-center">
          <div className='flex items-center gap-2'>
            {assignedBy && (
              <>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={assignedBy.avatarUrl} alt={assignedBy.name} />
                    <AvatarFallback>{getInitials(assignedBy.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-xs text-muted-foreground">Assigned by</p>
                    <p className="text-sm font-medium">{assignedBy.name}</p>
                </div>
              </>
            )}
          </div>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="To-Do">To-Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tasksLoaded = useRef(false);
  const usersLoaded = useRef(false);

  useEffect(() => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    };

    const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', user.uid));
    const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setUserTasks(tasksData);
      tasksLoaded.current = true;
      if (usersLoaded.current) {
        setIsLoading(false);
      }
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'tasks',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    const usersQuery = collection(db, 'users');
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      usersLoaded.current = true;
      if (tasksLoaded.current) {
        setIsLoading(false);
      }
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => {
      tasksUnsubscribe();
      usersUnsubscribe();
    }
  }, [user, db]);

  const getUserById = (id: string) => users.find(u => u.id === id);

  const todoTasks = userTasks.filter((task) => task.status === 'To-Do');
  const inProgressTasks = userTasks.filter(
    (task) => task.status === 'In Progress'
  );
  const doneTasks = userTasks.filter((task) => task.status === 'Done');

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle="Here are all the tasks assigned to you."
      />
      {isLoading ? <p>Loading tasks...</p> : 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">To-Do ({todoTasks.length})</h2>
          {todoTasks.length > 0 ? (
            todoTasks.map((task) => <TaskCard key={task.id} task={task} assignedBy={getUserById(task.assignedBy)} />)
          ) : (
            <p className="text-muted-foreground">No tasks to do.</p>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">In Progress ({inProgressTasks.length})</h2>
          {inProgressTasks.length > 0 ? (
            inProgressTasks.map((task) => <TaskCard key={task.id} task={task} assignedBy={getUserById(task.assignedBy)} />)
          ) : (
            <p className="text-muted-foreground">No tasks in progress.</p>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Done ({doneTasks.length})</h2>
          {doneTasks.length > 0 ? (
            doneTasks.map((task) => <TaskCard key={task.id} task={task} assignedBy={getUserById(task.assignedBy)} />)
          ) : (
            <p className="text-muted-foreground">No tasks completed yet.</p>
          )}
        </div>
      </div>}
    </div>
  );
}
