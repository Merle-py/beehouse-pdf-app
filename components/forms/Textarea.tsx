interface TextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    className?: string;
}

export default function Textarea({
    label,
    value,
    onChange,
    placeholder,
    required,
    disabled,
    rows = 4,
    className = ""
}: TextareaProps) {
    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                rows={rows}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                           transition-all duration-200 bg-white text-gray-900 
                           placeholder-gray-400 hover:border-gray-400
                           disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
                           resize-vertical"
            />
        </div>
    );
}
