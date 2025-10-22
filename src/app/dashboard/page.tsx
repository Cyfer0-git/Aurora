'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { useUser, useFirestore } from '@/firebase';
import {
  ClipboardList,
  Megaphone,
  Coffee,
  Play,
  Square,
  Timer,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { Task, Announcement } from '@/lib/definitions';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

function BreakTimer() {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOnBreak && breakStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - breakStartTime);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOnBreak, breakStartTime]);

  const handleToggleBreak = () => {
    if (isOnBreak) {
      setIsOnBreak(false);
      setBreakStartTime(null);
      setElapsedTime(0);
    } else {
      setIsOnBreak(true);
      setBreakStartTime(Date.now());
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-6 w-6" />
          Break Tracker
        </CardTitle>
        <CardDescription>Take a well-deserved break.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        <div className="text-4xl font-bold font-mono text-primary flex items-center gap-2">
          <Timer className="h-8 w-8" />
          <span>{formatTime(elapsedTime)}</span>
        </div>
        <Button
          onClick={handleToggleBreak}
          variant={isOnBreak ? 'destructive' : 'default'}
          className="w-full"
        >
          {isOnBreak ? (
            <>
              <Square className="mr-2 h-4 w-4" /> Stop Break
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Start Break
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if(!user || !db) return;
    
    const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', '==', user.uid));
    const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() } as Task));
      const activeTasks = allTasks.filter(task => task.status !== 'Done');
      setUserTasks(activeTasks);
    });

    const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(2));
    const announcementsUnsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
      setRecentAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });

    return () => {
      tasksUnsubscribe();
      announcementsUnsubscribe();
    }
  }, [user, db]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}!`}
        subtitle="Here's a summary of your workspace."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Active Tasks
            </CardTitle>
            <CardDescription>
              You have {userTasks.length} active task
              {userTasks.length !== 1 && 's'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userTasks.length > 0 ? (
              <ul className="space-y-4">
                {userTasks.slice(0, 3).map((task) => {
                   const dueDate = task.dueDate?.seconds ? new Date(task.dueDate.seconds * 1000) : new Date(task.dueDate);
                  return(
                  <li
                    key={task.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(dueDate, 'PPP')}
                      </p>
                    </div>
                    <Link href="/dashboard/tasks">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </li>
                )})}
              </ul>
            ) : (
              <p className="text-muted-foreground">No active tasks. Great job!</p>
            )}
            {userTasks.length > 3 && (
                 <Link href="/dashboard/tasks">
                    <Button variant="link" className="p-0 h-auto mt-4">View all tasks</Button>
                 </Link>
            )}
          </CardContent>
        </Card>

        <BreakTimer />

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Company Announcements
            </CardTitle>
            <CardDescription>
              Stay up to date with the latest news.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {recentAnnouncements.map((ann) => {
                const createdAtDate = ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000) : new Date();
                return (
                <li key={ann.id}>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(createdAtDate, { addSuffix: true })} by {ann.author}
                  </p>
                  <h3 className="font-semibold text-lg mt-1">{ann.title}</h3>
                  <p className="text-muted-foreground mt-1">{ann.content}</p>
                </li>
              )})}
            </ul>
             <Link href="/dashboard/announcements" className='mt-4 inline-block'>
                <Button variant="secondary">View All Announcements</Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
