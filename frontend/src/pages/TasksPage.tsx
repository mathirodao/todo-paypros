import { useState, useEffect, useMemo } from "react";
import {
  Task,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  CreateTaskPayload,
} from "../api/tasks";
import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import Button from "../components/ui/Button";

type Filter = "todo" | "pendiente" | "completado";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todo");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  // Handle create
  const handleCreate = async (data: CreateTaskPayload) => {
    const newTask = await createTask(data);
    setTasks((prev) => [newTask, ...prev]);
  };

  // Handle edit
  const handleUpdate = async (data: CreateTaskPayload) => {
    if (!editingTask) return;
    const updated = await updateTask(editingTask.id, data);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  // Toggle completado/pendiente
  const handleToggle = async (task: Task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  // Delete with a confirmation
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const openCreate = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === "pendiente") return tasks.filter((t) => !t.completed);
    if (filter === "completado") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  // Stats
  const stats = useMemo(
    () => ({
      total: tasks.length,
      pendiente: tasks.filter((t) => !t.completed).length,
      completado: tasks.filter((t) => t.completed).length,
    }),
    [tasks],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page title + new task button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Tareas</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {stats.pendiente} Pendiente · {stats.completado} Completado
            </p>
          </div>
          <Button onClick={openCreate} size="md">
            + Nueva tarea
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "bg-indigo-50 text-indigo-700",
            },
            {
              label: "Pendiente",
              value: stats.pendiente,
              color: "bg-amber-50 text-amber-700",
            },
            {
              label: "Completado",
              value: stats.completado,
              color: "bg-emerald-50 text-emerald-700",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center"
            >
              <div
                className={`text-2xl font-bold ${s.color.split(" ")[1]} mb-0.5`}
              >
                {s.value}
              </div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
          {(["todo", "pendiente", "completado"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">
              {filter === "completado" ? "🎉" : "📝"}
            </div>
            <p className="text-gray-500 font-medium">
              {filter === "todo"
                ? "No hay tareas. Crea la primera!"
                : filter === "pendiente"
                  ? "No hay tareas pendientes."
                  : "No hay tareas completadas."}
            </p>
            {filter === "todo" && (
              <Button variant="secondary" size="sm" onClick={openCreate}>
                + Agregar tarea
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create/edit modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
