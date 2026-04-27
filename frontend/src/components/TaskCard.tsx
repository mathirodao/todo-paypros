import { Task } from "../api/tasks";
import Badge from "./ui/Badge";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

// format "29 abr. 2026"
function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Returns true if the due date has already passed and the task isn't done
function isOverdue(task: Task) {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date();
}

export default function TaskCard({ task, onToggle, onEdit, onDelete }: Props) {
  const overdue = isOverdue(task);

  return (
    <div
      className={`bg-white rounded-xl border p-4 transition-all ${
        task.completed
          ? "border-gray-200 opacity-70"
          : "border-gray-200 hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion toggle checkbox */}
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-gray-300 hover:border-indigo-400"
          }`}
          title={task.completed ? "Mark as pending" : "Mark as completed"}
        >
          {task.completed && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        {/* task content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-gray-800 truncate ${
              task.completed ? "line-through text-gray-400" : ""
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Status badges and due date */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Completed / Pending */}
            <Badge
              variant={
                task.completed ? "completed" : overdue ? "overdue" : "pending"
              }
            >
              {task.completed ? "Completado" : "Pendiente"}
            </Badge>

            {/* Due date — red if overdue */}
            {task.dueDate && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  overdue ? "text-red-500" : "text-gray-400"
                }`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {overdue && "Atrasado · "}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Edit / delete actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Editar tarea"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar tarea"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
