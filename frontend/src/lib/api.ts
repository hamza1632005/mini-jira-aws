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

export async function getUserById(token: string, userId: string) {
  return request<{ userId: string; username: string; email: string }>(
    `/users/by-id/${encodeURIComponent(userId)}`,
    token
  );
}

export async function lookupUser(token: string, username: string) {
  return request<{ userId: string; username: string; email: string }>(
    `/users/lookup?username=${encodeURIComponent(username)}`,
    token
  );
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
    assigneeUsername?: string;
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

export async function updateComment(
  token: string,
  taskId: string,
  commentId: string,
  text: string
) {
  return request<Comment>(`/tasks/${taskId}/comments/${commentId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ text }),
  });
}

export async function deleteComment(
  token: string,
  taskId: string,
  commentId: string
) {
  return request<{ message: string }>(`/tasks/${taskId}/comments/${commentId}`, token, {
    method: "DELETE",
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

export async function updateProject(
  token: string,
  projectId: string,
  body: { name?: string; description?: string; teamId?: string }
) {
  return request<Project>(`/projects/${projectId}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteProject(token: string, projectId: string) {
  return request<{ message: string }>(`/projects/${projectId}`, token, {
    method: "DELETE",
  });
}

export async function updateTask(
  token: string,
  taskId: string,
  body: {
    title?: string;
    description?: string;
    priority?: string;
    deadline?: string;
    assigneeId?: string;
    assigneeUsername?: string;
    teamId?: string;
    projectId?: string;
  }
) {
  return request<Task>(`/tasks/${taskId}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTask(token: string, taskId: string) {
  return request<{ message: string }>(`/tasks/${taskId}`, token, {
    method: "DELETE",
  });
}

export async function getTeam(token: string, teamId: string) {
  return request<Team>(`/teams/${teamId}`, token);
}

export async function createTeam(token: string, body: { name: string }) {
  return request<Team>("/teams", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTeam(token: string, teamId: string, body: { name: string }) {
  return request<Team>(`/teams/${teamId}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTeam(token: string, teamId: string) {
  return request<{ message: string }>(`/teams/${teamId}`, token, {
    method: "DELETE",
  });
}

export async function getTeamMembers(token: string, teamId: string) {
  return request<{ userId: string; username: string; email: string }[]>(
    `/teams/${teamId}/members`,
    token
  );
}

export async function addTeamMember(
  token: string,
  teamId: string,
  username: string
) {
  return request<{ message: string }>(`/teams/${teamId}/members`, token, {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function removeTeamMember(
  token: string,
  teamId: string,
  userId: string
) {
  return request<{ success: boolean }>(
    `/teams/${teamId}/members/${userId}`,
    token,
    { method: "DELETE" }
  );
}

export async function getAllEmployees(token: string) {
  return request<{ userId: string; username: string; email: string; teamId: string | null }[]>(
    "/users",
    token,
    {}
  );
}

export async function register(body: {
  username: string;
  password: string;
  email: string;
  role: string;
  teamId?: string;
}) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as { message: string; userId: string };
}
