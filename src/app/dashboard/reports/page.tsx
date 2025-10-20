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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { reports, users } from '@/lib/data';
import type { Report } from '@/lib/definitions';
import { format, formatDistanceToNow } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, File, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const reportSchema = z.object({
  shiftType: z.enum(['morning', 'evening', 'night'], {
    required_error: 'Shift type is required.',
  }),
  date: z.date({ required_error: 'Date is required.' }),
  chatClosed: z.coerce.number().min(0),
  aidCase: z.coerce.number().min(0),
  call: z.coerce.number().min(0),
  loginHours: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
      message: 'Invalid time format. Use HH:MM:SS',
    }),
  satisfaction: z.coerce.number().min(0).max(100),
  frt: z.string().optional(),
  art: z.string().optional(),
  otherTask: z.string().optional(),
  typingSpeed: z.coerce.number().min(0),
  qaSheetCheck: z.boolean().default(false),
  content: z.string().min(10, "Please provide a brief summary.").optional(),
});

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userReports, setUserReports] = useState<Report[]>(
    reports.filter((r) => r.userId === user?.id)
  );

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  };

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      date: new Date(),
      chatClosed: 0,
      aidCase: 0,
      call: 0,
      loginHours: '00:00:00',
      satisfaction: 0,
      frt: '',
      art: '',
      otherTask: '',
      typingSpeed: 0,
      qaSheetCheck: false,
    },
  });

  function onSubmit(values: z.infer<typeof reportSchema>) {
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      userId: user!.id,
      ...values,
      date: values.date.toISOString(),
      content: values.content || 'N/A',
      submittedAt: new Date().toISOString(),
    };
    setUserReports((prev) => [newReport, ...prev]);
    toast({
      title: 'Report Submitted',
      description: 'Your daily report has been successfully submitted.',
    });
    form.reset();
  }

  const sortedReports = [...userReports].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <div>
      <PageHeader
        title="Submit Daily Task"
        subtitle="Submit your end-of-day report and view past entries."
      />
      <div className="flex flex-col gap-8">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Submit Today's Report</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="shiftType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chatClosed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat Closed</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="aidCase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AID Case</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="call"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loginHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="00:00:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="satisfaction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satisfaction %</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="frt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FRT</FormLabel>
                      <FormControl>
                        <Input placeholder="-" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="art"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ART</FormLabel>
                      <FormControl>
                        <Input placeholder="-" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="otherTask"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Task</FormLabel>
                      <FormControl>
                        <Input placeholder="-" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typingSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typing Speed (WPM)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qaSheetCheck"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>QA Sheet Check</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide a brief summary of your work..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Data
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Past Reports</h2>
          <div className="space-y-4">
            {sortedReports.length > 0 ? (
              sortedReports.map((report) => {
                const reportUser = users.find((u) => u.id === report.userId);
                return (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        {reportUser && (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={reportUser.avatarUrl} />
                            <AvatarFallback>
                              {getInitials(reportUser.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="w-full">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-lg">
                              {reportUser?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(
                                new Date(report.submittedAt),
                                'PPP p'
                              )}
                            </p>
                          </div>
                           <p className="text-sm text-muted-foreground">
                            Shift: <span className="capitalize">{report.shiftType}</span> | Report for: {format(new Date(report.date), 'PPP')}
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
              })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                    <File className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">No Reports Found</h3>
                    <p>You haven't submitted any reports yet.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
