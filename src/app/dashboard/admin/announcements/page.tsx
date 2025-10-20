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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';


const announcementSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters.' }),
  content: z
    .string()
    .min(20, { message: 'Content must be at least 20 characters.' }),
});

export default function ManageAnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '' },
  });

  async function onSubmit(values: z.infer<typeof announcementSchema>) {
    if (!user) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        title: values.title,
        content: values.content,
        author: user.name,
        authorId: user.id,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Announcement Published',
        description: 'Your announcement is now visible to the team.',
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not publish announcement.',
      });
      console.error(error);
    }
  }
  
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast({
        title: 'Announcement Deleted',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete announcement.',
      });
      console.error(error);
    }
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
