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
  dueDate: string;
  status: 'To-Do' | 'In Progress' | 'Done';
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author: string; // User name
  createdAt: string;
};

export type Report = {
  id: string;
  userId: string;
  content: string;
  submittedAt: string;
};
