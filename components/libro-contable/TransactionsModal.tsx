import React, { useState, useMemo } from 'react';
import { Transaction } from './LibroContableView';
import { Permissions, Expense, ExpenseCategory, Office, User, PaymentMethod, CompanyInfo, Supplier, PaymentStatus, ShippingStatus } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PlusIcon, TrashIcon, EditIcon } from '../icons/Icons';
import ExpenseFormModal from './ExpenseFormModal';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const paymentStatusColors: { [key in PaymentStatus]: string } = {
    'Pagada': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
    'Pendiente': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
};

const shippingStatusColors: { [key in ShippingStatus]: string } = {
    'Pendiente para Despacho': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
    'En Tránsito': 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
    'Entregada': 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
};

const expenseStatusColors: { [key: string]: string } = {
    'Pagado': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
    'Pendiente': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
};

const ITEMS_PER_PAGE = 15;

interface TransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    permissions: Permissions;
    onSaveExpense: (expense: Expense) => Promise<void>;
    onDeleteExpense: (expenseId: string) => Promise<void>;
    expenseCategories: ExpenseCategory[];
    offices: Office[];
    paymentMethods: PaymentMethod[];
    currentUser: User;
    companyInfo: CompanyInfo;
    suppliers: Supplier[];
}

const TransactionsModal: React.FC<TransactionsModalProps> = ({ isOpen, onClose, transactions, permissions, onSaveExpense, onDeleteExpense, expenseCategories, offices, paymentMethods, currentUser, companyInfo, suppliers }) => {
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    
    const { 
        paginatedData, 
        currentPage, 
        totalPages, 
        setCurrentPage,
        totalItems
    } = usePagination(transactions, ITEMS_PER_PAGE);

    const totals = useMemo(() => {
        return transactions.reduce((acc, t) => {
            if (t.type === 'Ingreso') {
                acc.income += t.amount;
            } else {
                acc.expense += t.amount;
            }
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactions]);

    const handleOpenExpenseModal = (expense: Expense | null) => {
        setEditingExpense(expense);
        setIsExpenseModalOpen(true);
    };

    const handleSaveExpense = async (expense: Expense) => {
        await onSaveExpense(expense);
        setIsExpenseModalOpen(false);
    };
    
    const getStatusBadge = (t: Transaction) => {
        if (t.type === 'Ingreso') {
            const invoice = t.originalDoc as any;
            return (
                <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[invoice.paymentStatus]}`}>
                        {invoice.paymentStatus}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shippingStatusColors[invoice.shippingStatus]}`}>
                        {invoice.shippingStatus}
                    </span>
                </div>
            );
        }
        if (t.type === 'Gasto' && t.status) {
            return (
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expenseStatusColors[t.status]}`}>
                    {t.status}
                </span>
            );
        }
        return null;
    };


    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Libro de Transacciones" size="4xl">
                <div className="flex justify-end mb-4">
                     {permissions['libro-contable.create'] && (<Button onClick={() => handleOpenExpenseModal(null)}><PlusIcon className="w-4 h-4 mr-2" /> Añadir Gasto</Button>)}
                </div>
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">Descripción</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-black uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">Ingreso</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">Gasto</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-black">
                            {paginatedData.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{t.date}</td>
                                    <td className="px-6 py-4 text-sm text-black">{t.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {getStatusBadge(t)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-sm text-green-600">
                                        {t.type === 'Ingreso' ? formatCurrency(t.amount) : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-sm text-red-600">
                                        {t.type === 'Gasto' ? formatCurrency(t.amount) : ''}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {t.type === 'Gasto' && permissions['libro-contable.edit'] && <Button variant="secondary" size="sm" onClick={() => handleOpenExpenseModal(t.originalDoc as Expense)}><EditIcon className="w-4 h-4"/></Button>}
                                        {t.type === 'Gasto' && permissions['libro-contable.delete'] && <Button variant="danger" size="sm" onClick={async () => {
                                            if (window.confirm('¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer.')) {
                                                await onDeleteExpense(t.originalDoc.id);
                                            }
                                        }}><TrashIcon className="w-4 h-4"/></Button>}
                                    </td>
                                </tr>
                            ))}
                              {paginatedData.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No hay transacciones para mostrar.</td></tr>
                             )}
                        </tbody>
                         <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-semibold text-black">
                            <tr>
                                <td className="px-6 py-3 text-left text-sm text-black" colSpan={3}>
                                    TOTALES ({totalItems} registros)
                                </td>
                                <td className="px-6 py-3 text-right text-sm text-green-600">
                                    {formatCurrency(totals.income)}
                                </td>
                                <td className="px-6 py-3 text-right text-sm text-red-600">
                                    {formatCurrency(totals.expense)}
                                </td>
                                <td className="px-6 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </Modal>
            
            <ExpenseFormModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={editingExpense}
                expenseCategories={expenseCategories}
                offices={offices}
                paymentMethods={paymentMethods}
                currentUser={currentUser}
                companyInfo={companyInfo}
                suppliers={suppliers}
            />
        </>
    );
};

export default TransactionsModal;