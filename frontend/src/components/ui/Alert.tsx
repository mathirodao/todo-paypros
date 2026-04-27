import { ReactNode } from "react";

type AlertProps = {
  children: ReactNode;
  variant?: "error" | "success" | "warning";
};

export default function Alert({ children, variant = "error" }: AlertProps) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-600",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}
