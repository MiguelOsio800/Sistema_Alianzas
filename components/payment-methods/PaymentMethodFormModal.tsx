


import React, { useState, useEffect } from 'react';
import { PaymentMethod, PaymentMethodType } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface PaymentMethodFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (paymentMethod: PaymentMethod) => void;
    paymentMethod: PaymentMethod | null;
}

const PaymentMethodFormModal: React.FC<PaymentMethodFormModalProps> = ({ isOpen, onClose, onSave, paymentMethod }) => {
    const [formData, setFormData] = useState<Partial<PaymentMethod>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(paymentMethod || { name: '', type: 'Efectivo' });
        }
    }, [paymentMethod, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as PaymentMethod);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={paymentMethod ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" label="Etiqueta Descriptiva" placeholder="Ej: Cuenta Corriente BDV" value={formData.name || ''} onChange={handleChange} required />
                
                <Select name="type" label="Tipo de Pago" value={formData.type || 'Efectivo'} onChange={handleChange}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="PagoMovil">Pago Móvil</option>
                    <option value="Credito">Crédito</option>
                    <option value="Otro">Otro</option>
                </Select>

                {formData.type === 'Transferencia' && (
                    <div className="p-4 border dark:border-gray-600 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800/50">
                        <h4 className="font-semibold text-md">Detalles de la Cuenta Bancaria</h4>
                        <Input name="bankName" label="Nombre del Banco" value={formData.bankName || ''} onChange={handleChange} />
                        <Input name="accountNumber" label="Número de Cuenta (20 dígitos)" value={formData.accountNumber || ''} onChange={handleChange} maxLength={20} />
                        <Select name="accountType" label="Tipo de Cuenta" value={formData.accountType || 'corriente'} onChange={handleChange}>
                            <option value="corriente">Corriente</option>
                            <option value="ahorro">Ahorro</option>
                        </Select>
                        <Input name="beneficiaryName" label="Nombre del Beneficiario" value={formData.beneficiaryName || ''} onChange={handleChange} />
                        <Input name="beneficiaryId" label="RIF / Cédula del Beneficiario" value={formData.beneficiaryId || ''} onChange={handleChange} />
                        <Input name="email" label="Email (Opcional)" type="email" value={formData.email || ''} onChange={handleChange} />
                    </div>
                )}

                {formData.type === 'PagoMovil' && (
                     <div className="p-4 border dark:border-gray-600 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800/50">
                        <h4 className="font-semibold text-md">Detalles del Pago Móvil</h4>
                        <Input name="bankName" label="Nombre del Banco" value={formData.bankName || ''} onChange={handleChange} />
                        <Input name="phone" label="Número de Teléfono" value={formData.phone || ''} onChange={handleChange} />
                        <Input name="beneficiaryName" label="Nombre del Beneficiario" value={formData.beneficiaryName || ''} onChange={handleChange} />
                        <Input name="beneficiaryId" label="Cédula del Beneficiario" value={formData.beneficiaryId || ''} onChange={handleChange} />
                    </div>
                )}


                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default PaymentMethodFormModal;