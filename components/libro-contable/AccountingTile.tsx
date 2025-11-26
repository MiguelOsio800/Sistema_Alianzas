

import React from 'react';
import { ChevronRightIcon } from '../icons/Icons';

interface AccountingTileProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    colorVariant?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorStyles = {
    blue: 'from-blue-600 to-blue-800',
    green: 'from-teal-500 to-green-700',
    purple: 'from-indigo-500 to-purple-700',
    orange: 'from-amber-500 to-orange-600',
};

const AccountingTile: React.FC<AccountingTileProps> = ({ title, description, icon: Icon, onClick, colorVariant = 'blue' }) => {
    return (
        <button
            onClick={onClick}
            className={`
                relative group w-full p-5 rounded-xl text-white overflow-hidden
                flex items-center gap-5
                bg-gradient-to-br ${colorStyles[colorVariant]}
                transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-opacity-50 dark:focus:ring-offset-gray-900
            `}
        >
            <div className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10">
                 <Icon className="w-full h-full" />
            </div>

            <div className="flex-shrink-0 bg-white/20 p-3 rounded-lg">
                <Icon className="w-7 h-7" />
            </div>
            <div className="text-left flex-grow">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm opacity-80 mt-1">{description}</p>
            </div>
            <ChevronRightIcon className="flex-shrink-0 w-7 h-7 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
        </button>
    );
}

export default AccountingTile;
