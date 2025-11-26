import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, error, ...props }) => {
    const errorClasses = 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500';
    const defaultClasses = 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    const isPlaceholder = !props.value || props.value === '';

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <select
                id={id}
                className={`block w-full rounded-md border shadow-sm py-2 pl-3 pr-10 focus:outline-none sm:text-sm bg-gray-50 dark:bg-gray-700 ${isPlaceholder ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-200'} ${error ? errorClasses : defaultClasses}`}
                {...props}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
            >
                {children}
            </select>
            {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default Select;