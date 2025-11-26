import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, Office, User, PaymentMethod, CompanyInfo, Supplier } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { ChevronDownIcon, ChevronUpIcon } from '../icons/Icons';
import SupplierSearchInput from '../proveedores/SupplierSearchInput';

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Expense) => void;
    expense: Expense | null;
    expenseCategories: ExpenseCategory[];
    offices: Office[];
    paymentMethods: PaymentMethod[];
    currentUser: User;
    companyInfo: CompanyInfo;
    suppliers: Supplier[];
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expense, expenseCategories, offices, paymentMethods, currentUser, companyInfo, suppliers }) => {
    const [formData, setFormData] = useState<Partial<Expense>>({});
    const [isFiscalDetailsVisible, setIsFiscalDetailsVisible] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isOperator = currentUser.roleId !== 'role-admin' && currentUser.roleId !== 'role-tech';

    useEffect(() => {
        if (isOpen) {
            const defaultOfficeId = isOperator && currentUser.officeId ? currentUser.officeId : (expense?.officeId || '');
            const initialData = expense || {
                date: new Date().toISOString().split('T')[0],
                description: '',
                category: expenseCategories[0]?.name || '',
                amount: 0,
                status: 'Pendiente',
                officeId: defaultOfficeId,
                paymentMethodId: paymentMethods[0]?.id || '',
                supplierName: '',
                supplierRif: '',
                invoiceNumber: '',
                controlNumber: '',
            };
            setFormData(initialData);
            setIsFiscalDetailsVisible(!!initialData.supplierRif || !!initialData.invoiceNumber);
            setErrors({});
        }
    }, [expense, isOpen, expenseCategories, offices, paymentMethods, currentUser, isOperator]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSelectSupplier = (supplier: Supplier) => {
        setFormData(prev => ({
            ...prev,
            supplierRif: supplier.idNumber,
            supplierName: supplier.name,
        }));
    };

    const handleSupplierChange = (field: 'supplierRif' | 'supplierName', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.date) newErrors.date = 'La fecha es requerida.';
        if (!formData.description?.trim()) newErrors.description = 'La descripción es requerida.';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'El monto debe ser mayor a cero.';
        
        if (isFiscalDetailsVisible) {
            if (!formData.supplierRif?.trim()) newErrors.supplierRif = 'El RIF del proveedor es requerido.';
            if (!formData.supplierName?.trim()) newErrors.supplierName = 'El nombre del proveedor es requerido.';
            if (!formData.invoiceNumber?.trim()) newErrors.invoiceNumber = 'El N° de factura es requerido.';
            if (!formData.controlNumber?.trim()) newErrors.controlNumber = 'El N° de control es requerido.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData as Expense);
        }
    };
    
    const bcvRate = companyInfo?.bcvRate || 0;
    const amountInVes = formData.amount || 0;
    const amountInUsd = bcvRate > 0 ? amountInVes / bcvRate : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Editar Gasto' : 'Nuevo Gasto'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="date" label="Fecha del Gasto" type="date" value={formData.date || ''} onChange={handleChange} required error={errors.date}/>
                <Input name="description" label="Descripción del Gasto" value={formData.description || ''} onChange={handleChange} required error={errors.description}/>
                
                <div
                    className="flex justify-between items-center cursor-pointer p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsFiscalDetailsVisible(!isFiscalDetailsVisible)}
                >
                    <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200">Datos del Proveedor (para Libro de Compras)</h4>
                    <div className={`transform transition-transform duration-300 ${isFiscalDetailsVisible ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon className="w-5 h-5" />
                    </div>
                </div>

                <div className={`grid transition-all duration-500 ease-in-out ${isFiscalDetailsVisible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="p-4 border border-t-0 dark:border-gray-600 rounded-b-lg space-y-4 bg-white dark:bg-gray-800/20">
                            <SupplierSearchInput
                                suppliers={suppliers}
                                onSupplierSelect={handleSelectSupplier}
                                currentRif={formData.supplierRif || ''}
                                onRifChange={(value) => handleSupplierChange('supplierRif', value)}
                            />
                            {errors.supplierRif && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.supplierRif}</p>}
                            
                            <Input name="supplierName" label="Nombre o Razón Social del Proveedor" value={formData.supplierName || ''} onChange={(e) => handleSupplierChange('supplierName', e.target.value)} required={isFiscalDetailsVisible} error={errors.supplierName}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input name="invoiceNumber" label="Nº de Factura del Proveedor" value={formData.invoiceNumber || ''} onChange={handleChange} required={isFiscalDetailsVisible} error={errors.invoiceNumber}/>
                                <Input name="controlNumber" label="Nº de Control del Proveedor" value={formData.controlNumber || ''} onChange={handleChange} required={isFiscalDetailsVisible} error={errors.controlNumber}/>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Select label="Categoría de Gasto" name="category" value={formData.category || ''} onChange={handleChange}>
                        {expenseCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                     </Select>
                     <Select label="Oficina Asociada (Opcional)" name="officeId" value={formData.officeId || ''} onChange={handleChange} disabled={isOperator}>
                        {!isOperator && <option value="">Gasto General</option>}
                        {offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}
                    </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Input name="amount" label="Monto Total (Bs.)" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} required error={errors.amount}/>
                        {amountInVes > 0 && bcvRate > 0 && (
                            <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1 pr-1">
                                Equivalente: ${amountInUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                     <Select label="Forma de Pago" name="paymentMethodId" value={formData.paymentMethodId || ''} onChange={handleChange}>
                        {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                     </Select>
                </div>
                 <Select label="Estado del Pago" name="status" value={formData.status || 'Pendiente'} onChange={handleChange}>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Pagado">Pagado</option>
                </Select>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Gasto</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ExpenseFormModal;