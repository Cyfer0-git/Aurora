import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { announcements } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <PageHeader
        title="Company Announcements"
        subtitle="Stay up-to-date with the latest news and updates."
      />
      <div className="space-y-6">
        {sortedAnnouncements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Posted by {announcement.author} &bull;{' '}
                    {formatDistanceToNow(new Date(announcement.createdAt), {
                      addSuffix: true,
                    })}
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
