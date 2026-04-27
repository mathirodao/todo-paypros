import { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "pending" | "completed" | "overdue";
};

export default function Badge({ children, variant = "pending" }: BadgeProps) {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
