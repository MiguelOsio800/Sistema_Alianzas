import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { ExpenseCategory, Permissions } from '../../types';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon } from '../icons/Icons';
import ExpenseCategoryModal from './ExpenseCategoryModal';


interface ExpenseCategoryManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    expenseCategories: ExpenseCategory[];
    onSaveExpenseCategory: (category: ExpenseCategory) => Promise<void>;
    onDeleteExpenseCategory: (categoryId: string) => Promise<void>;
    permissions: Permissions;
}

const ExpenseCategoryManagementModal: React.FC<ExpenseCategoryManagementModalProps> = ({ isOpen, onClose, expenseCategories, onSaveExpenseCategory, onDeleteExpenseCategory, permissions }) => {
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

    const handleOpenFormModal = (category: ExpenseCategory | null) => {
        setEditingCategory(category);
        setIsFormModalOpen(true);
    };

    const handleSave = async (category: ExpenseCategory) => {
        await onSaveExpenseCategory(category);
        // The form modal closes itself on save
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías de Gastos" size="lg">
                 <div className="flex justify-end mb-4">
                    {permissions['libro-contable.create'] && <Button size="md" onClick={() => handleOpenFormModal(null)}><PlusIcon className="w-4 h-4 mr-1"/>Añadir Categoría</Button>}
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    {expenseCategories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-800/50 group">
                            <span className="text-gray-700 dark:text-gray-200 font-medium">{cat.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                {permissions['libro-contable.edit'] && <Button variant="secondary" size="sm" onClick={() => handleOpenFormModal(cat)}><EditIcon className="w-4 h-4"/></Button>}
                                {permissions['libro-contable.delete'] && <Button variant="danger" size="sm" onClick={async () => {
                                    if (window.confirm('¿Está seguro de que desea eliminar esta categoría de gasto? Esta acción no se puede deshacer.')) {
                                        await onDeleteExpenseCategory(cat.id);
                                    }
                                }}><TrashIcon className="w-4 h-4"/></Button>}
                            </div>
                        </div>
                    ))}
                     {expenseCategories.length === 0 && <p className="text-center py-10 text-gray-500">No hay categorías de gastos.</p>}
                </div>
            </Modal>
            
            <ExpenseCategoryModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSave}
                category={editingCategory}
            />
        </>
    );
};

export default ExpenseCategoryManagementModal;