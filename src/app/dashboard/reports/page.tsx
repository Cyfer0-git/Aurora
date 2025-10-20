'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { reports, users } from '@/lib/data';
import type { Report } from '@/lib/definitions';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


const reportSchema = z.object({
  content: z
    .string()
    .min(10, { message: 'Report must be at least 10 characters long.' })
    .max(500, { message: 'Report cannot exceed 500 characters.' }),
});

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Mock local state for reports
  const [userReports, setUserReports] = useState<Report[]>(
    reports.filter((r) => r.userId === user?.id)
  );
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length-1][0]}`;
    }
    return names[0].substring(0, 2);
  }

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      content: '',
    },
  });

  function onSubmit(values: z.infer<typeof reportSchema>) {
    const newReport: Report = {
        id: `rep-${Date.now()}`,
        userId: user!.id,
        content: values.content,
        submittedAt: new Date().toISOString(),
    };
    setUserReports(prev => [newReport, ...prev]);
    toast({
      title: 'Report Submitted',
      description: 'Your daily report has been successfully submitted.',
    });
    form.reset();
  }

  const sortedReports = [...userReports].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="Submit your work updates and view your submission history."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Submit Today's Report</CardTitle>
                  <CardDescription>
                    What have you accomplished today?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Report Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Finished designing the homepage mockups and started on the about page..."
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
                    Submit Report
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Submission History</h2>
          <div className="space-y-4">
            {sortedReports.length > 0 ? (
              sortedReports.map((report) => {
                const reportUser = users.find(u => u.id === report.userId);
                return (
                    <Card key={report.id}>
                        <CardContent className='pt-6'>
                            <div className="flex items-start gap-4">
                                {reportUser && (
                                    <Avatar>
                                        <AvatarImage src={reportUser.avatarUrl} />
                                        <AvatarFallback>{getInitials(reportUser.name)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className='w-full'>
                                    <div className='flex justify-between items-center'>
                                        <p className="font-semibold">{reportUser?.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                        {format(new Date(report.submittedAt), 'PPP p')}
                                        </p>
                                    </div>
                                    <p className="text-muted-foreground mt-2">{report.content}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
              })
            ) : (
              <Card>
                <CardContent className='pt-6'>
                  <p className="text-muted-foreground text-center">
                    You haven't submitted any reports yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
