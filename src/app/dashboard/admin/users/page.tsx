'use client';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const newUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  role: z.enum(['admin', 'Support', 'VIP', 'CS'], { required_error: 'Role is required.' }),
});

export default function ManageUsersPage() {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const [userList, setUserList] = useState<User[]>([]);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !db || !currentUser || currentUser.role !== 'admin') {
        setIsLoading(true);
        return;
    }

    setIsLoading(true);
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });
      setUserList(users);
      setIsLoading(false);
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db, currentUser, isUserLoading]);

  const form = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: '', email: '', role: 'Support' },
  });
  
  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    if (!db) return;
    if (currentUser?.uid === userId && newRole !== 'admin') {
      toast({
        variant: "destructive",
        title: "Action Forbidden",
        description: "Admins cannot demote their own role.",
      });
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    updateDoc(userDocRef, { role: newRole })
      .then(() => {
        toast({
            title: 'Role Updated',
            description: 'User role has been successfully changed.',
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: { role: newRole },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  async function onSubmit(values: z.infer<typeof newUserSchema>) {
    if (!db) return;
    const userExists = userList.some(user => user.email === values.email);
    if(userExists){
      toast({
        variant: "destructive",
        title: "User already exists",
        description: "A user with this email is already in the system.",
      })
      return;
    }

    const newUser = {
        name: values.name,
        email: values.email,
        role: values.role,
        avatarUrl: `https://picsum.photos/seed/${userList.length + 1}/40/40`,
        id: '', // Intentionally left blank for invited users
    };

    addDoc(collection(db, 'users'), newUser)
    .then(() => {
        toast({
            title: 'User Invited',
            description: `${values.name} has been added. They will need to sign up to create their password.`,
        });
        form.reset();
        setIsDialogOpen(false);
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'create',
            requestResourceData: newUser,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    if (currentUser?.uid === userId) {
      toast({
        variant: "destructive",
        title: "Cannot delete yourself",
        description: "Admins cannot delete their own accounts.",
      });
      return;
    }

    const docRef = doc(db, "users", userId);
    deleteDoc(docRef)
    .then(() => {
        toast({
            title: "User Deleted",
            description: "The user has been removed from the team.",
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
  };

  return (
    <div>
      <PageHeader
        title="Manage Users"
        subtitle={!isLoading ? `There are ${userList.length} users in your team.` : ` `}
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new team member and assign them a role. They will need to sign up to set their password.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="Support">Support</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="CS">CS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Create User</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className='flex items-center justify-center gap-2'>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : userList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(newRole: User['role']) => handleRoleChange(user.id, newRole)}
                      disabled={currentUser?.uid === user.id}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="CS">CS</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" disabled={currentUser?.uid === user.id}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the user <span className='font-bold'>{user.name}</span>. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
