import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { users, tasks, reports } from '@/lib/data';
import { Users, ClipboardList, FileText } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const totalUsers = users.length;
  const activeTasks = tasks.filter((t) => t.status !== 'Done').length;
  const recentReports = reports.slice(0, 5);

  const getUserById = (id: string) => users.find(u => u.id === id);

  return (
    <div>
      <PageHeader
        title="Admin Overview"
        subtitle="Manage your team and monitor activity."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              team members in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks}</div>
            <p className="text-xs text-muted-foreground">
              tasks currently in progress or to-do
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Today</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter(r => new Date(r.submittedAt).toDateString() === new Date().toDateString()).length}</div>
            <p className="text-xs text-muted-foreground">
              submissions in the last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Daily Reports</CardTitle>
          <CardDescription>
            A quick look at the latest updates from your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {recentReports.map(report => {
                    const user = getUserById(report.userId);
                    return (
                        <li key={report.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <p className="font-semibold">{user?.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{report.content}</p>
                        </li>
                    )
                })}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
