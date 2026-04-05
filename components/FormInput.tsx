"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border ${
            error ? "border-red-500/60" : "border-white/[0.08]"
          } text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15 focus:bg-white/[0.06] hover:border-white/[0.14]`}
          {...props}
        />
        {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;
