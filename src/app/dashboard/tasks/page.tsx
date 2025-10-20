'use client';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { tasks, users } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import type { Task } from '@/lib/definitions';
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
import { useState } from 'react';

function TaskCard({ task }: { task: Task }) {
  // Local state to manage task status for demonstration
  const [status, setStatus] = useState(task.status);
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length-1][0]}`;
    }
    return names[0].substring(0, 2);
  }

  const assignedBy = users.find((u) => u.id === task.assignedBy);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription className="mt-1">
                Due: {format(new Date(task.dueDate), 'PPP')}
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
          <Select value={status} onValueChange={(value) => setStatus(value as Task['status'])}>
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
  const { user } = useAuth();
  const userTasks = tasks.filter((task) => task.assignedTo === user?.id);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">To-Do ({todoTasks.length})</h2>
          {todoTasks.length > 0 ? (
            todoTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="text-muted-foreground">No tasks to do.</p>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">In Progress ({inProgressTasks.length})</h2>
          {inProgressTasks.length > 0 ? (
            inProgressTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="text-muted-foreground">No tasks in progress.</p>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Done ({doneTasks.length})</h2>
          {doneTasks.length > 0 ? (
            doneTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="text-muted-foreground">No tasks completed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
