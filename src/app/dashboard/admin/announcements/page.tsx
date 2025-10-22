'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Announcement } from '@/lib/definitions';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const announcementSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters.' }),
  content: z
    .string()
    .min(20, { message: 'Content must be at least 20 characters.' }),
});

export default function ManageAnnouncementsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const announcements: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        announcements.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAllAnnouncements(announcements);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  });

  async function onSubmit(values: z.infer<typeof announcementSchema>) {
    if (!user || !db) return;
    const newAnnouncement = {
      title: values.title,
      content: values.content,
      author: user.name,
      authorId: user.uid,
      createdAt: serverTimestamp(),
    };
    
    addDoc(collection(db, 'announcements'), newAnnouncement)
    .then(() => {
        toast({
            title: 'Announcement Published',
            description: 'Your announcement is now visible to the team.',
        });
        form.reset();
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'announcements',
            operation: 'create',
            requestResourceData: newAnnouncement,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }
  
  const handleDelete = async (id: string) => {
    if (!db) return;
    const docRef = doc(db, 'announcements', id);
    deleteDoc(docRef)
    .then(() => {
        toast({
            title: 'Announcement Deleted',
        });
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  return (
    <div>
      <PageHeader
        title="Manage Announcements"
        subtitle="Create and manage announcements for your team."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>New Announcement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Q3 Goals" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write the announcement details here..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">
                    Publish Announcement
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Published Announcements</h2>
          <div className="space-y-4">
            {isLoading ? <p>Loading announcements...</p> : allAnnouncements.map((ann) => (
              <Card key={ann.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{ann.title}</CardTitle>
                      <CardDescription className="mt-1">
                        By {ann.author} &bull;{' '}
                        {ann.createdAt ? formatDistanceToNow(new Date(ann.createdAt.seconds * 1000), {
                          addSuffix: true,
                        }) : 'Just now'}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ann.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{ann.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
