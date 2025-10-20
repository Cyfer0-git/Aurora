import { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'member';
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // User ID
  assignedBy: string; // User ID
  dueDate: Timestamp | string;
  status: 'To-Do' | 'In Progress' | 'Done';
  createdAt: Timestamp;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author: string; // User name
  authorId: string; // User ID
  createdAt: Timestamp;
};

export type Report = {
  id: string;
  userId: string;
  shiftType: 'morning' | 'evening' | 'night';
  date: Timestamp | string;
  chatClosed: number;
  aidCase: number;
  call: number;
  loginHours: string;
  satisfaction: number;
  frt: string;
  art: string;
  otherTask: string;
  typingSpeed: number;
  qaSheetCheck: boolean;
  content: string; 
  submittedAt: Timestamp;
};
