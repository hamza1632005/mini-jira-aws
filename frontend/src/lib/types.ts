export type TaskStatus = "ToDo" | "InProgress" | "InReview" | "Done";

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
  teamId?: string;
}

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  priority: string;
  status: TaskStatus;
  teamId: string;
  assigneeId?: string;
  projectId?: string;
  deadline?: string;
  attachments?: string[];
  s3Key?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  commentId: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Team {
  teamId: string;
  name: string;
}

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  teamId: string;
  createdAt: string;
}

export const STATUS_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "ToDo", label: "To Do" },
  { id: "InProgress", label: "In Progress" },
  { id: "InReview", label: "In Review" },
  { id: "Done", label: "Done" },
];

export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  ToDo: ["InProgress"],
  InProgress: ["InReview"],
  InReview: ["Done"],
  Done: [],
};

export const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-800 border-red-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Low: "bg-green-100 text-green-800 border-green-200",
};
