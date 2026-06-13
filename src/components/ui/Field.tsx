import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const inputClasses =
  "w-full rounded-2xl border border-white/15 bg-[rgba(2,6,23,0.35)] px-4 py-3 text-body outline-none transition placeholder:text-white/40 focus:border-cyan/75 focus:ring-4 focus:ring-cyan/15";

export function Field({ label, error, id, ...props }: FieldProps) {
  const fieldId = id || props.name;
  return (
    <div className="flex flex-col">
      <label htmlFor={fieldId} className="mb-2 text-sm text-[#cbd5f5]">
        {label}
      </label>
      <input id={fieldId} className={inputClasses} {...props} />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextareaField({ label, error, id, ...props }: TextareaFieldProps) {
  const fieldId = id || props.name;
  return (
    <div className="flex flex-col">
      <label htmlFor={fieldId} className="mb-2 text-sm text-[#cbd5f5]">
        {label}
      </label>
      <textarea id={fieldId} className={`${inputClasses} min-h-[110px] resize-y`} {...props} />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
