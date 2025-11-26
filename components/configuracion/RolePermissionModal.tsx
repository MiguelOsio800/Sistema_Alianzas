import React, { useState, useEffect } from 'react';
import { Role, Permissions } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ALL_PERMISSION_KEYS, PERMISSION_KEY_TRANSLATIONS } from '../../constants';
import Input from '../ui/Input';
import { SearchIcon, ChevronRightIcon, ChevronLeftIcon } from '../icons/Icons';

// Helper to make permission keys more readable
const formatPermissionKey = (key: string): string => {
    // Use translation if available, otherwise format the key
    return PERMISSION_KEY_TRANSLATIONS[key] || (() => {
        const [module, action] = key.split('.');
        if (!module || !action) return key; // Fallback for invalid keys
        const formattedModule = module.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
        return `${formattedModule} / ${formattedAction}`;
    })();
};

interface PermissionListProps {
    title: string;
    permissions: string[];
    selectedPermissions: string[];
    onSelect: (key: string) => void;
    searchTerm?: string;
    onSearch?: (term: string) => void;
}

const PermissionListBox: React.FC<PermissionListProps> = ({ title, permissions, selectedPermissions, onSelect, searchTerm, onSearch }) => (
    <div className="flex flex-col border dark:border-gray-600 rounded-lg w-full h-96">
        <h3 className="text-lg font-semibold p-3 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">{title}</h3>
        {onSearch && (
            <div className="p-2 border-b dark:border-gray-600">
                <Input
                    label=""
                    id={`search-${title.replace(/\s+/g, '-')}`}
                    placeholder="Filtrar permisos..."
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    icon={<SearchIcon className="w-4 h-4 text-gray-400" />}
                />
            </div>
        )}
        <ul className="overflow-y-auto flex-1 p-1">
            {permissions.length > 0 ? permissions.map(key => (
                <li key={key}>
                    <button
                        type="button"
                        onClick={() => onSelect(key)}
                        className={`w-full text-left text-sm p-2 rounded-md transition-colors ${selectedPermissions.includes(key) ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        {formatPermissionKey(key)}
                    </button>
                </li>
            )) : <li className="p-4 text-center text-sm text-gray-500">No hay permisos.</li>}
        </ul>
    </div>
);

const RolePermissionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (roleId: string, permissions: Permissions) => void;
    role: Role;
}> = ({ isOpen, onClose, onSave, role }) => {
    const [chosen, setChosen] = useState<string[]>([]);
    const [available, setAvailable] = useState<string[]>([]);
    
    const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
    const [selectedChosen, setSelectedChosen] = useState<string[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            const chosenPermissions = Object.keys(role.permissions).filter(key => role.permissions[key]);
            const availablePermissions = ALL_PERMISSION_KEYS.filter(key => !chosenPermissions.includes(key));
            setChosen(chosenPermissions.sort());
            setAvailable(availablePermissions.sort());
            setSelectedAvailable([]);
            setSelectedChosen([]);
            setSearchTerm('');
        }
    }, [role, isOpen]);

    const handleSelect = (list: 'available' | 'chosen', key: string) => {
        const selectedList = list === 'available' ? selectedAvailable : selectedChosen;
        const setSelected = list === 'available' ? setSelectedAvailable : setSelectedChosen;
        
        if (selectedList.includes(key)) {
            setSelected(selectedList.filter(k => k !== key));
        } else {
            setSelected([...selectedList, key]);
        }
    };
    
    const moveSelected = (from: 'available' | 'chosen') => {
        if (from === 'available') {
            setChosen([...chosen, ...selectedAvailable].sort());
            setAvailable(available.filter(k => !selectedAvailable.includes(k)));
            setSelectedAvailable([]);
        } else {
            setAvailable([...available, ...selectedChosen].sort());
            setChosen(chosen.filter(k => !selectedChosen.includes(k)));
            setSelectedChosen([]);
        }
    };

    const filteredAvailable = available.filter(key => formatPermissionKey(key).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const moveAll = (from: 'available' | 'chosen') => {
         if (from === 'available') {
            setChosen([...chosen, ...filteredAvailable].sort());
            setAvailable(available.filter(k => !filteredAvailable.includes(k)));
        } else {
            setAvailable([...available, ...chosen].sort());
            setChosen([]);
        }
        setSelectedAvailable([]);
        setSelectedChosen([]);
    }

    const handleSubmit = () => {
        const newPermissions: Permissions = chosen.reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Permissions);
        onSave(role.id, newPermissions);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Permisos para el rol: ${role.name}`} size="4xl">
            <div className="flex flex-col md:flex-row items-stretch gap-4">
                {/* Available */}
                <PermissionListBox
                    title={`Permisos Disponibles (${filteredAvailable.length})`}
                    permissions={filteredAvailable}
                    selectedPermissions={selectedAvailable}
                    onSelect={(key) => handleSelect('available', key)}
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                />
                
                {/* Controls */}
                <div className="flex flex-row md:flex-col items-center justify-center gap-2 my-4 md:my-0">
                    <Button type="button" variant="secondary" onClick={() => moveAll('chosen')} title="Remover todos" className="p-2">&lt;&lt;</Button>
                    <Button type="button" variant="secondary" onClick={() => moveSelected('chosen')} disabled={selectedChosen.length === 0} title="Remover seleccionados" className="p-2">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => moveSelected('available')} disabled={selectedAvailable.length === 0} title="Añadir seleccionados" className="p-2">
                        <ChevronRightIcon className="w-5 h-5" />
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => moveAll('available')} title="Añadir todos los filtrados" className="p-2">&gt;&gt;</Button>
                </div>
                
                {/* Chosen */}
                <PermissionListBox
                    title={`Permisos Asignados (${chosen.length})`}
                    permissions={chosen.sort()}
                    selectedPermissions={selectedChosen}
                    onSelect={(key) => handleSelect('chosen', key)}
                />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t dark:border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Guardar Permisos</Button>
            </div>
        </Modal>
    );
};

export default RolePermissionModal;