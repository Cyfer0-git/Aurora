'use client';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Announcement } from '@/lib/definitions';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';


export default function AnnouncementsPage() {
  const db = useFirestore();
  const [sortedAnnouncements, setSortedAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const announcementsData: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        announcementsData.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setSortedAnnouncements(announcementsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  return (
    <div>
      <PageHeader
        title="Company Announcements"
        subtitle="Stay up-to-date with the latest news and updates."
      />
      <div className="space-y-6">
        {isLoading ? <p>Loading announcements...</p> : sortedAnnouncements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Posted by {announcement.author} &bull;{' '}
                    {announcement.createdAt ? formatDistanceToNow(new Date(announcement.createdAt.seconds * 1000), {
                      addSuffix: true,
                    }) : 'Just now'}
                  </CardDescription>
                </div>
                <div className='p-3 bg-secondary rounded-full'>
                  <Megaphone className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
