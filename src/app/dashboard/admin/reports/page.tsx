import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { reports, users } from '@/lib/data';
import { format } from 'date-fns';

export default function ViewReportsPage() {
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length-1][0]}`;
    }
    return names[0].substring(0, 2);
  }

  const getUserById = (id: string) => users.find(u => u.id === id);

  return (
    <div>
      <PageHeader
        title="Team Reports"
        subtitle="Review daily updates from all team members."
      />
      <div className="space-y-4">
        {sortedReports.map((report) => {
          const user = getUserById(report.userId);
          return (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {user && (
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(report.submittedAt), 'PPP p')}
                      </p>
                    </div>
                    <p className="text-muted-foreground mt-2">{report.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
