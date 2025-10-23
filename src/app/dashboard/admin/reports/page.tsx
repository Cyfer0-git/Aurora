'use client';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { format } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import type { Report, User } from '@/lib/definitions';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ViewReportsPage() {
  const db = useFirestore();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const [sortedReports, setSortedReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Combined loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !db || !currentUser || currentUser.role !== 'admin') {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    let reportsData: Report[] = [];
    let usersData: User[] = [];
    let reportsDone = false;
    let usersDone = false;

    const checkLoadingDone = () => {
      if (reportsDone && usersDone) {
        setIsLoading(false);
      }
    };

    const reportsQuery = query(collection(db, 'reports'), orderBy('submittedAt', 'desc'));
    const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setSortedReports(reportsData);
      reportsDone = true;
      checkLoadingDone();
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'reports',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        reportsDone = true;
        checkLoadingDone();
    });

    const usersQuery = collection(db, 'users');
    const usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
      usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      usersDone = true;
      checkLoadingDone();
    },
    (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'users',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        usersDone = true;
        checkLoadingDone();
    });

    return () => {
      reportsUnsubscribe();
      usersUnsubscribe();
    }
  }, [db, currentUser, isUserLoading]);

  const getInitials = (name: string) => {
    if(!name) return '';
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
        {isLoading ? <p>Loading reports...</p> : sortedReports.map((report) => {
          const user = getUserById(report.userId);
          const submittedAtDate = report.submittedAt?.seconds ? new Date(report.submittedAt.seconds * 1000) : new Date();
          const reportDate = report.date?.seconds ? new Date(report.date.seconds * 1000) : new Date(report.date);

          return (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {user && (
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-lg">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(submittedAtDate, 'PPP p')}
                      </p>
                    </div>
                     <p className="text-sm text-muted-foreground">
                      Shift: <span className="capitalize">{report.shiftType}</span> | Report for: {format(reportDate, 'PPP')}
                     </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{report.content}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Login Hours</span>
                      <span className="font-semibold">{report.loginHours}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Satisfaction</span>
                      <span className="font-semibold">{report.satisfaction}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">Chats Closed</span>
                      <span className="font-semibold">{report.chatClosed}</span>
                    </div>
                     <div className="flex flex-col">
                      <span className="text-muted-foreground">Calls</span>
                      <span className="font-semibold">{report.call}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">AID Cases</span>
                      <span className="font-semibold">{report.aidCase}</span>
                    </div>
                     <div className="flex flex-col">
                      <span className="text-muted-foreground">Typing Speed</span>
                      <span className="font-semibold">{report.typingSpeed} WPM</span>
                    </div>
                     <div className="flex flex-col">
                      <span className="text-muted-foreground">Other Task</span>
                      <span className="font-semibold">{report.otherTask || 'N/A'}</span>
                    </div>
                     <div className="flex flex-col">
                      <span className="text-muted-foreground">QA Check</span>
                      <span className="font-semibold">{report.qaSheetCheck ? "Yes" : "No"}</span>
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
