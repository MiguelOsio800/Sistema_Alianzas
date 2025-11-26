import React from 'react';

interface ConfigTileProps {
    title: string;
    icon: React.ElementType;
    onClick: () => void;
    disabled?: boolean;
}

const ConfigTile: React.FC<ConfigTileProps> = ({ title, icon: Icon, onClick, disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                group aspect-square flex flex-col items-center justify-center p-4
                rounded-xl text-white text-center shadow-lg
                transition-all duration-300 ease-in-out
                transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2
                focus:ring-primary-400 dark:focus:ring-offset-gray-900
                bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-600 dark:to-primary-800
                ${disabled
                    ? 'from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 cursor-not-allowed opacity-70'
                    : 'hover:from-primary-500 hover:to-primary-700'
                }
            `}
        >
            <Icon className="w-10 h-10 mb-3 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
            <span className="font-semibold text-xs sm:text-sm leading-tight">
                {title}
            </span>
        </button>
    );
};

export default ConfigTile;
