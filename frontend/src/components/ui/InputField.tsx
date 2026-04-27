import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface BaseInputProps {
  label?: string;
  error?: string;
  required?: boolean;
}

type InputFieldProps = BaseInputProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaFieldProps = BaseInputProps &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function InputField({
  label,
  error,
  required,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...props}
        className={`w-full border ${
          error ? "border-red-300" : "border-gray-300"
        } rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  required,
  className = "",
  ...props
}: TextAreaFieldProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full border ${
          error ? "border-red-300" : "border-gray-300"
        } rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
