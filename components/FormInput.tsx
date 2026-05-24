import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({
  label,
  id,
  type,
  error,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Check if this input is originally a password field
  const isPassword = type === 'password';

  // Toggle input type between password and text
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`w-full bg-slate-50 dark:bg-white/5 border ${
            error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-slate-200 dark:border-white/10 focus:border-cyan-500/50'
          } rounded-xl py-2.5 pl-4 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-red-500/50' : 'focus:ring-cyan-500/50'
          } transition-all`}
          {...props}
        />
        {/* Render the toggle button only for password fields */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}
