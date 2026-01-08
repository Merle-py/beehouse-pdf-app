interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Select({
    label,
    value,
    onChange,
    options,
    placeholder = "Selecione uma opção",
    required,
    disabled,
    className = ""
}: SelectProps) {
    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                           transition-all duration-200 bg-white text-gray-900 
                           hover:border-gray-400
                           disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
