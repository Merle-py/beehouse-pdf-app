interface InputProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    helpText?: string;
}

export default function Input({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    required,
    disabled,
    className = "",
    helpText
}: InputProps) {
    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                           transition-all duration-200 bg-white text-gray-900 
                           placeholder-gray-400 hover:border-gray-400
                           disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
            />
            {helpText && (
                <p className="mt-1 text-sm text-gray-600">
                    {helpText}
                </p>
            )}
        </div>
    );
}
