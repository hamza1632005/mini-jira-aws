import type { Comment, Project, Task, TaskStatus, Team, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data.token as string;
}

export async function getMe(token: string) {
  return request<User>("/users/me", token);
}

export async function getTasks(token: string, teamId?: string) {
  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return request<Task[]>(`/tasks${query}`, token);
}

export async function getTask(token: string, taskId: string) {
  return request<Task>(`/tasks/${taskId}`, token);
}

export async function createTask(
  token: string,
  body: {
    title: string;
    description?: string;
    priority?: string;
    deadline?: string;
    assigneeId?: string;
    teamId: string;
    projectId?: string;
  }
) {
  return request<Task>("/tasks", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTaskStatus(
  token: string,
  taskId: string,
  status: TaskStatus
) {
  return request<Task>(`/tasks/${taskId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getComments(token: string, taskId: string) {
  return request<Comment[]>(`/tasks/${taskId}/comments`, token);
}

export async function addComment(
  token: string,
  taskId: string,
  text: string
) {
  return request<Comment>(`/tasks/${taskId}/comments`, token, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function getUploadUrl(token: string, taskId: string) {
  return request<{ uploadUrl: string; s3Key: string }>(
    `/tasks/${taskId}/upload-url`,
    token
  );
}

export async function uploadFile(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new Error("File upload failed");
}

export async function getTeams(token: string) {
  return request<Team[]>("/teams", token);
}

export async function getProjects(token: string) {
  return request<Project[]>("/projects", token);
}

export async function createProject(
  token: string,
  body: { name: string; description?: string; teamId: string }
) {
  return request<Project>("/projects", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
