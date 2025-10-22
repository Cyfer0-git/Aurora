'use client';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, ClipboardList, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { User, Task, Report } from '@/lib/definitions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export default function AdminDashboardPage() {
  const db = useFirestore();
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [reportsToday, setReportsToday] = useState(0);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    if (!db) return;

    // Fetch all users and create a map
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = new Map<string, User>();
      snapshot.forEach(doc => usersData.set(doc.id, { id: doc.id, ...doc.data() } as User));
      setUsersMap(usersData);
      setTotalUsers(snapshot.size);
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    // Fetch active tasks
    const activeTasksQuery = query(collection(db, 'tasks'), where('status', '!=', 'Done'));
    const tasksUnsub = onSnapshot(
      activeTasksQuery,
      (snapshot) => {
        setActiveTasks(snapshot.size);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: activeTasksQuery.converter?.toString() || 'tasks',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    // Fetch reports submitted today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const qReports = query(
      collection(db, 'reports'),
      where('submittedAt', '>=', startOfToday)
    );
    const reportsUnsub = onSnapshot(qReports, (snapshot) => {
      setReportsToday(snapshot.size);
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: qReports.converter?.toString() || 'reports',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
    
    // Fetch recent reports
    const recentReportsQuery = query(
        collection(db, "reports"), 
        orderBy("submittedAt", "desc"), 
        limit(5)
    );
    const recentReportsUnsub = onSnapshot(recentReportsQuery, (snapshot) => {
       setRecentReports(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Report)));
    },
    async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: recentReportsQuery.converter?.toString() || 'reports',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => {
      usersUnsub();
      tasksUnsub();
      reportsUnsub();
      recentReportsUnsub();
    };
  }, [db]);

  const getUserById = (id: string) => usersMap.get(id);

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
            <div className="text-2xl font-bold">{reportsToday}</div>
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

    