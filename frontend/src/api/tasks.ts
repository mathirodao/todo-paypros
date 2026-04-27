import api from "./axios";

export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
}

export const getTasks = () => api.get<Task[]>("/tasks").then((r) => r.data);

export const createTask = (data: CreateTaskPayload) =>
  api.post<Task>("/tasks", data).then((r) => r.data);

export const updateTask = (id: number, data: UpdateTaskPayload) =>
  api.put<Task>(`/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: number) => api.delete(`/tasks/${id}`);
