'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
} from "@/components/ui/alert-dialog";
import { Calendar } from '@/components/ui/calendar';
import type { Task, User } from '@/lib/definitions';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const taskSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' }),
  assignedTo: z.string({ required_error: 'Please select a user.' }),
  dueDate: z.date({ required_error: 'A due date is required.' }),
});

export default function ManageTasksPage() {
  const { user: adminUser, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !db || !adminUser || adminUser.role !== 'admin') {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    let tasksDone = false;
    let usersDone = false;

    const checkLoadingDone = () => {
      if (tasksDone && usersDone) {
        setIsLoading(false);
      }
    };

    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setAllTasks(tasksData);
      tasksDone = true;
      checkLoadingDone();
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'tasks',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        tasksDone = true;
        checkLoadingDone();
    });

    const usersQuery = collection(db, 'users');
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      usersDone = true;
      checkLoadingDone();
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        usersDone = true;
        checkLoadingDone();
    });

    return () => {
      tasksUnsubscribe();
      usersUnsubscribe();
    }
  }, [db, adminUser, isUserLoading]);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
  });

  async function onSubmit(values: z.infer<typeof taskSchema>) {
    if (!adminUser || !db) return;
    const newTask = {
      title: values.title,
      description: values.description,
      assignedTo: values.assignedTo,
      assignedBy: adminUser.uid,
      dueDate: values.dueDate,
      status: 'To-Do',
      createdAt: serverTimestamp(),
    }
    addDoc(collection(db, 'tasks'), newTask)
    .then(() => {
        toast({
            title: 'Task Created',
            description: `"${values.title}" has been assigned.`,
        });
        form.reset();
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'tasks',
            operation: 'create',
            requestResourceData: newTask,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!db) return;
    const docRef = doc(db, "tasks", taskId);
    deleteDoc(docRef)
    .then(() => {
        toast({
            title: "Task Deleted",
            description: "The task has been removed.",
        });
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const getInitials = (name: string) => {
    if(!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  }

  const getUserById = (id: string) => users.find(u => u.id === id);


  return (
    <div>
      <PageHeader
        title="Manage Tasks"
        subtitle="Create, assign, and track tasks for your team."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle /> Create New Task
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Design new logo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details about the task..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Create and Assign Task
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">All Tasks</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={5} className='text-center py-4'>Loading tasks...</TableCell></TableRow> : allTasks.map((task) => {
                    const assignedUser = getUserById(task.assignedTo);
                    const dueDate = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : new Date(task.dueDate);
                    return (
                        <TableRow key={task.id}>
                            <TableCell className='font-medium'>{task.title}</TableCell>
                            <TableCell>
                                {assignedUser && (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignedUser.avatarUrl} alt={assignedUser.name}/>
                                            <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                                        </Avatar>
                                        {assignedUser.name}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{format(dueDate, 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                                <Badge variant={task.status === 'Done' ? 'default' : task.status === 'In Progress' ? 'secondary' : 'outline'} className={cn(task.status === 'Done' && 'bg-green-600')}>{task.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the task <span className='font-bold'>"{task.title}"</span>. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteTask(task.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
