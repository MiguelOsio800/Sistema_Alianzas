import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, icon, error, ...props }) => {
    const errorClasses = 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500';
    const defaultClasses = 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';
    
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <div className="relative">
                {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>}
                <input
                    id={id}
                    className={`block w-full rounded-md border shadow-sm sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 ${props.type === 'date' ? '[color-scheme:light]' : ''} ${icon ? 'pl-10' : ''} ${error ? errorClasses : defaultClasses}`}
                    {...props}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
            </div>
            {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default Input;
