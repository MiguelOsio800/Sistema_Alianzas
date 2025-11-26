
import React, { useState, useEffect, useCallback } from 'react';
import { ShippingGuide, Client, Merchandise, Financials, Category, Invoice, Office, ShippingType, PaymentMethod, CompanyInfo, User } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import FinancialSummary from '../shipping-guide/FinancialSummary';
import { PlusCircleIcon, TrashIcon, SaveIcon, XCircleIcon, SendIcon } from '../icons/Icons';
import ClientSearchInput from './ClientSearchInput';
import { calculateFinancialDetails } from '../../utils/financials';
import { useToast } from '../ui/ToastProvider';
import { apiFetch } from '../../utils/api';


const initialClientState: Partial<Client> = { id: '', idNumber: '', name: '', phone: '', address: '', clientType: 'persona', email: '' };
const initialMerchandise: Merchandise = { quantity: 1, weight: 0, length: 0, width: 0, height: 0, description: '', categoryId: '' };
const initialFinancials: Financials = { freight: 0, insuranceCost: 0, handling: 0, discount: 0, subtotal: 0, ipostel: 0, iva: 0, igtf: 0, total: 0 };

type BaseFormProps = {
    companyInfo: CompanyInfo;
    categories: Category[];
    clients: Client[];
    offices: Office[];
    shippingTypes: ShippingType[];
    paymentMethods: PaymentMethod[];
    currentUser: User;
};

type CreateFormProps = BaseFormProps & {
    invoice?: null;
    onSave: (invoice: Omit<Invoice, 'status' | 'paymentStatus' | 'shippingStatus'>) => Promise<Invoice | null>;
};

type EditFormProps = BaseFormProps & {
    invoice: Invoice;
    onSave: (invoice: Invoice) => Promise<Invoice | null>;
};

type InvoiceFormProps = CreateFormProps | EditFormProps;

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, invoice = null, companyInfo, categories, clients, offices, shippingTypes, paymentMethods, currentUser }) => {
    
    const isOperator = currentUser.roleId !== 'role-admin' && currentUser.roleId !== 'role-tech';
    const { addToast } = useToast();
    
    const getInitialGuideState = useCallback((): ShippingGuide => {
        if (invoice) return invoice.guide;

        const userOfficeId = isOperator && currentUser.officeId ? currentUser.officeId : offices[0]?.id || '';
        
        const today = new Date();
        const localDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        return {
            guideNumber: `G-${Date.now()}`,
            date: localDateString,
            originOfficeId: userOfficeId,
            destinationOfficeId: offices.find(o => o.id !== userOfficeId)?.id || offices[1]?.id || '',
            sender: initialClientState,
            receiver: initialClientState,
            merchandise: [{ ...initialMerchandise, categoryId: categories[0]?.id || '' }],
            shippingTypeId: shippingTypes[0]?.id || '',
            paymentMethodId: paymentMethods[0]?.id || '',
            hasInsurance: false,
            declaredValue: 0,
            insurancePercentage: 2,
            paymentType: 'flete-pagado',
            paymentCurrency: 'VES',
            hasDiscount: false,
            discountPercentage: 0,
            pickupOrder: '',
            isTransbordo: false,
            receivedBy: '',
        }
    }, [invoice, currentUser, offices, categories, shippingTypes, paymentMethods, isOperator]);

    const [guide, setGuide] = useState<ShippingGuide>(getInitialGuideState());
    const [financials, setFinancials] = useState<Financials>(initialFinancials);
    const [errors, setErrors] = useState<any>({});
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (!invoice) {
            setGuide(g => ({
                ...g,
                originOfficeId: g.originOfficeId || (isOperator && currentUser.officeId ? currentUser.officeId : offices[0]?.id || ''),
                destinationOfficeId: g.destinationOfficeId || offices[1]?.id || '',
                shippingTypeId: g.shippingTypeId || shippingTypes[0]?.id || '',
                paymentMethodId: g.paymentMethodId || paymentMethods[0]?.id || '',
                merchandise: g.merchandise.map(m => ({...m, categoryId: m.categoryId || categories[0]?.id || ''})),
                pickupOrder: g.pickupOrder || '',
                isTransbordo: g.isTransbordo || false,
                receivedBy: g.receivedBy || '',
            }));
        }
    }, [offices, shippingTypes, paymentMethods, categories, invoice, isOperator, currentUser]);

    useEffect(() => {
        const newFinancials = calculateFinancialDetails(guide, companyInfo);
        setFinancials(newFinancials);
    }, [guide, companyInfo]);
    
    useEffect(() => {
        const totalWeight = guide.merchandise.reduce((acc, item) => {
            const realWeight = Number(item.weight) || 0;
            const volumetricWeight = (Number(item.length) * Number(item.width) * Number(item.height)) / 5000;
            return acc + Math.max(realWeight, volumetricWeight) * (Number(item.quantity) || 1);
        }, 0);
        const freight = totalWeight * (companyInfo.costPerKg || 0);

        if (guide.declaredValue !== freight) {
            setGuide(g => ({...g, declaredValue: freight}));
        }
    }, [guide.merchandise, companyInfo.costPerKg]);


    const handleClientChange = (party: 'sender' | 'receiver', field: keyof Client, value: string) => {
        setGuide(prev => {
            const updatedParty = { ...prev[party], [field]: value };

            if(field === 'idNumber') {
                if (value.toUpperCase().startsWith('J-')) {
                    updatedParty.clientType = 'empresa';
                } else {
                    updatedParty.clientType = 'persona';
                }
            }
           
            return {
                ...prev,
                [party]: updatedParty
            };
        });
    };

    const handleSelectClient = (party: 'sender' | 'receiver', client: Client) => {
        setGuide(prev => ({
            ...prev,
            [party]: client,
        }));
    };
    
    const handleMerchandiseChange = (index: number, field: keyof Merchandise, value: string | number) => {
        const newMerchandise = guide.merchandise.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item };
                const numericFields: (keyof Merchandise)[] = ['quantity', 'weight', 'length', 'width', 'height'];
                if (numericFields.includes(field as keyof Merchandise)) {
                    (updatedItem as any)[field] = parseFloat(value as string) || 0;
                } else {
                    (updatedItem as any)[field] = value;
                }
                return updatedItem;
            }
            return item;
        });
        setGuide(prev => ({ ...prev, merchandise: newMerchandise }));
    };

    const addMerchandiseItem = () => {
        setGuide(prev => ({
            ...prev,
            merchandise: [...prev.merchandise, { ...initialMerchandise, categoryId: categories[0]?.id || '' }]
        }));
    };
    
    const removeMerchandiseItem = (index: number) => {
        if (guide.merchandise.length > 1) {
            const newMerchandise = guide.merchandise.filter((_, i) => i !== index);
            setGuide(prev => ({ ...prev, merchandise: newMerchandise }));
        }
    };
    
    const validateForm = (): boolean => {
        const newErrors: any = { sender: {}, receiver: {}, merchandise: [] };
        let isValid = true;
    
        // Validate Sender
        if (!guide.sender.idNumber?.trim()) { newErrors.sender.idNumber = 'Identificación requerida.'; isValid = false; }
        if (!guide.sender.name?.trim()) { newErrors.sender.name = 'Nombre requerido.'; isValid = false; }
        if (!guide.sender.phone?.trim()) { newErrors.sender.phone = 'Teléfono requerido.'; isValid = false; }
        if (!guide.sender.address?.trim()) { newErrors.sender.address = 'Dirección requerida.'; isValid = false; }
    
        // Validate Receiver
        if (!guide.receiver.idNumber?.trim()) { newErrors.receiver.idNumber = 'Identificación requerida.'; isValid = false; }
        if (!guide.receiver.name?.trim()) { newErrors.receiver.name = 'Nombre requerido.'; isValid = false; }
        if (!guide.receiver.phone?.trim()) { newErrors.receiver.phone = 'Teléfono requerido.'; isValid = false; }
        if (!guide.receiver.address?.trim()) { newErrors.receiver.address = 'Dirección requerida.'; isValid = false; }
    
        // Validate Offices
        if (guide.originOfficeId === guide.destinationOfficeId) {
            newErrors.destinationOfficeId = 'El destino no puede ser igual al origen.';
            isValid = false;
        }
    
        // Validate Merchandise
        guide.merchandise.forEach((item, index) => {
            const itemErrors: any = {};
            if (!item.description.trim()) { itemErrors.description = 'Descripción requerida.'; isValid = false; }
            if (item.quantity <= 0) { itemErrors.quantity = 'Debe ser > 0'; isValid = false; }
            const hasWeight = item.weight > 0;
            const hasDimensions = item.length > 0 && item.width > 0 && item.height > 0;
            if (!hasWeight && !hasDimensions) {
                itemErrors.weight = 'Se requiere peso o dimensiones.';
                isValid = false;
            }
            newErrors.merchandise[index] = itemErrors;
        });
    
        setErrors(newErrors);
        return isValid;
    };

    const buildInvoiceObject = (): Invoice | Omit<Invoice, 'status' | 'paymentStatus' | 'shippingStatus'> => {
        // Capture current user name as Creator
        const creatorName = currentUser.name;

        if (invoice) { // EDIT MODE
            return {
                ...invoice,
                date: guide.date,
                clientName: guide.sender.name || 'N/A',
                clientIdNumber: guide.sender.idNumber || 'N/A',
                totalAmount: financials.total,
                guide: guide,
                // Preserve original creator if exists, otherwise use current user (legacy fix)
                createdByName: invoice.createdByName || creatorName
            };
        } else { // CREATE MODE
            return {
                id: `INV-${Date.now()}`,
                invoiceNumber: `F-${String(Date.now()).slice(-6)}`,
                controlNumber: `C-${String(Date.now()).slice(-8)}`,
                date: guide.date,
                clientName: guide.sender.name || 'N/A',
                clientIdNumber: guide.sender.idNumber || 'N/A',
                totalAmount: financials.total,
                guide: guide,
                createdByName: creatorName // Explicitly set current user on creation
            };
        }
    };


    const handleSave = async () => {
        if (!validateForm()) {
            addToast({ type: 'error', title: 'Error de Validación', message: 'Por favor, corrija los campos marcados en rojo.' });
            return;
        }
        const invoiceObject = buildInvoiceObject();
        
        let savedInvoice: Invoice | null = null;
        if (invoice) { // Edit mode
            savedInvoice = await (onSave as EditFormProps['onSave'])(invoiceObject as Invoice);
        } else { // Create mode
            savedInvoice = await (onSave as CreateFormProps['onSave'])(invoiceObject as Omit<Invoice, 'status' | 'paymentStatus' | 'shippingStatus'>);
        }

        if (savedInvoice) {
            window.location.hash = 'invoices';
        }
    };

    const sendToFiscalPrinter = async (invoiceData: Invoice) => {
        if (!invoiceData.id) {
             addToast({ type: 'error', title: 'Error', message: 'ID de factura no válido para enviar.' });
             return;
        }

        addToast({
            type: 'info',
            title: 'Enviando a Impresora Fiscal',
            message: `Procesando factura ${invoiceData.invoiceNumber}...`
        });

        try {
            const result = await apiFetch<{ hkaResponse?: { cufe?: string }, message: string }>(`/invoices/${invoiceData.id}/send-to-hka`, {
                method: 'POST',
            });
            
            addToast({
                type: 'success',
                title: 'Factura Fiscalizada',
                message: result.message || `Factura enviada. CUFE: ${result.hkaResponse?.cufe}`
            });

        } catch (error: any) {
             addToast({
                type: 'error',
                title: 'Error Fiscal',
                message: error.message || `Fallo al comunicar con el servicio fiscal.`
            });
        }
    };
    
    const handleSaveAndSend = async () => {
        if (!validateForm()) {
            addToast({ type: 'error', title: 'Error de Validación', message: 'Por favor, corrija los campos marcados en rojo.' });
            return;
        }
        
        const invoiceObject = buildInvoiceObject();
        
        let savedInvoice: Invoice | null = null;
        if (invoice) { // Edit mode
            savedInvoice = await (onSave as EditFormProps['onSave'])(invoiceObject as Invoice);
        } else { // Create mode
            savedInvoice = await (onSave as CreateFormProps['onSave'])(invoiceObject as Omit<Invoice, 'status' | 'paymentStatus' | 'shippingStatus'>);
        }

        if (savedInvoice) {
            await sendToFiscalPrinter(savedInvoice);
            window.location.hash = 'invoices';
        }
    };
    
    const resetForm = () => {
        setGuide(getInitialGuideState());
        setErrors({});
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fecha: <strong className="font-bold text-gray-800 dark:text-gray-200">{new Date(guide.date + 'T00:00:00').toLocaleDateString('es-VE', {timeZone: 'UTC'})}</strong> | Hora: <strong className="font-bold text-gray-800 dark:text-gray-200">{currentTime.toLocaleTimeString('es-VE')}</strong>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Oficinista: <strong className="font-bold text-gray-800 dark:text-gray-200">{invoice?.createdByName || currentUser.name}</strong>
                    </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant="secondary" onClick={resetForm}><XCircleIcon className="w-4 h-4 mr-2" />Limpiar</Button>
                    <Button variant="secondary" onClick={handleSave}><SaveIcon className="w-4 h-4 mr-2" />{invoice ? 'Actualizar' : 'Solo Guardar'}</Button>
                    <Button onClick={handleSaveAndSend}>
                        <SendIcon className="w-4 h-4 mr-2" />
                        {invoice ? 'Actualizar y Enviar' : 'Guardar y Enviar'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Remitente</CardTitle></CardHeader>
                        <div className="space-y-4">
                             <ClientSearchInput
                                clients={clients}
                                onClientSelect={(client) => handleSelectClient('sender', client)}
                                party='sender'
                                guide={guide}
                                onClientChange={handleClientChange}
                                error={errors.sender?.idNumber}
                            />
                            <Input label="Nombre" value={guide.sender.name || ''} onChange={e => handleClientChange('sender', 'name', e.target.value)} error={errors.sender?.name} />
                            <Input label="Teléfono" value={guide.sender.phone || ''} onChange={e => handleClientChange('sender', 'phone', e.target.value)} error={errors.sender?.phone} />
                            <Input label="Correo Electrónico" type="email" value={guide.sender.email || ''} onChange={e => handleClientChange('sender', 'email', e.target.value)} />
                            <Input label="Dirección" value={guide.sender.address || ''} onChange={e => handleClientChange('sender', 'address', e.target.value)} error={errors.sender?.address} />
                        </div>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Destinatario</CardTitle></CardHeader>
                        <div className="space-y-4">
                            <ClientSearchInput
                                clients={clients}
                                onClientSelect={(client) => handleSelectClient('receiver', client)}
                                party='receiver'
                                guide={guide}
                                onClientChange={handleClientChange}
                                error={errors.receiver?.idNumber}
                            />
                            <Input label="Nombre" value={guide.receiver.name || ''} onChange={e => handleClientChange('receiver', 'name', e.target.value)} error={errors.receiver?.name} />
                            <Input label="Teléfono" value={guide.receiver.phone || ''} onChange={e => handleClientChange('receiver', 'phone', e.target.value)} error={errors.receiver?.phone} />
                            <Input label="Correo Electrónico" type="email" value={guide.receiver.email || ''} onChange={e => handleClientChange('receiver', 'email', e.target.value)} />
                            <Input label="Dirección" value={guide.receiver.address || ''} onChange={e => handleClientChange('receiver', 'address', e.target.value)} error={errors.receiver?.address} />
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Detalles de Mercancía</CardTitle></CardHeader>
                        {guide.merchandise.map((item, index) => {
                            const volWeight = (Number(item.length) * Number(item.width) * Number(item.height)) / 5000;
                            const itemErrors = errors.merchandise?.[index] || {};
                            return (
                                <div key={index} className="space-y-4 p-4 mb-4 border dark:border-gray-700 rounded-lg relative">
                                    {guide.merchandise.length > 1 && (
                                        <button onClick={() => removeMerchandiseItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input label="Cantidad" type="number" value={item.quantity} onChange={e => handleMerchandiseChange(index, 'quantity', e.target.value)} error={itemErrors.quantity} />
                                        <Input label="Peso (Kg)" type="number" value={item.weight} onChange={e => handleMerchandiseChange(index, 'weight', e.target.value)} error={itemErrors.weight} />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Dimensiones (cm)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Input label="Largo" type="number" value={item.length} onChange={e => handleMerchandiseChange(index, 'length', e.target.value)} />
                                        <Input label="Ancho" type="number" value={item.width} onChange={e => handleMerchandiseChange(index, 'width', e.target.value)} />
                                        <Input label="Alto" type="number" value={item.height} onChange={e => handleMerchandiseChange(index, 'height', e.target.value)} />
                                    </div>
                                     <p className="text-xs text-gray-400 dark:text-gray-500 text-right">Peso Volumétrico: {volWeight.toFixed(2)} kg</p>
                                    <Input label="Descripción" value={item.description} onChange={e => handleMerchandiseChange(index, 'description', e.target.value)} error={itemErrors.description} />
                                    <Select label="Categoría" value={item.categoryId} onChange={e => handleMerchandiseChange(index, 'categoryId', e.target.value)}>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </Select>
                                </div>
                            )
                        })}
                        <Button variant="secondary" onClick={addMerchandiseItem} className="w-full mt-2">
                           <PlusCircleIcon className="w-5 h-5 mr-2" /> Añadir Otro Paquete
                        </Button>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="sticky top-6">
                         <Card>
                            <CardHeader><CardTitle>Condiciones del Envío</CardTitle></CardHeader>
                            <div className="space-y-4">
                                <Select label="Oficina de Origen" value={guide.originOfficeId} onChange={e => setGuide(g => ({...g, originOfficeId: e.target.value}))} disabled={isOperator && !!currentUser.officeId}>
                                    {offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}
                                </Select>
                                <Select label="Oficina de Destino" value={guide.destinationOfficeId} onChange={e => setGuide(g => ({...g, destinationOfficeId: e.target.value}))} error={errors.destinationOfficeId}>
                                    {offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}
                                </Select>
                                <Select label="Tipo de Envío" value={guide.shippingTypeId} onChange={e => setGuide(g => ({...g, shippingTypeId: e.target.value as any}))}>
                                    {shippingTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                </Select>
                                <Select label="Forma de Pago" value={guide.paymentMethodId} onChange={e => setGuide(g => ({...g, paymentMethodId: e.target.value as any}))}>
                                    {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                </Select>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Select label="Condición" value={guide.paymentType} onChange={e => setGuide(g => ({...g, paymentType: e.target.value as any}))}>
                                        <option value="flete-pagado">Flete Pagado</option>
                                        <option value="flete-destino">Flete a Destino</option>
                                    </Select>
                                    <Select label="Moneda" value={guide.paymentCurrency} onChange={e => setGuide(g => ({...g, paymentCurrency: e.target.value as any}))}>
                                        <option value="VES">Bolívares (VES)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input 
                                        label="Orden de Recogida" 
                                        value={guide.pickupOrder || ''} 
                                        onChange={e => setGuide(g => ({...g, pickupOrder: e.target.value}))} 
                                    />
                                    <Select 
                                        label="Transbordo" 
                                        value={guide.isTransbordo ? 'Si' : 'No'} 
                                        onChange={e => setGuide(g => ({...g, isTransbordo: e.target.value === 'Si'}))}
                                    >
                                        <option value="No">No</option>
                                        <option value="Si">Si</option>
                                    </Select>
                                </div>
                                <div className="space-y-2 pt-2 border-t dark:border-gray-700">
                                    <div className="flex items-center">
                                        <input id="insurance" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={guide.hasInsurance} onChange={e => setGuide(g => ({...g, hasInsurance: e.target.checked}))} />
                                        <label htmlFor="insurance" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Asegurar envío</label>
                                    </div>
                                    {guide.hasInsurance && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input label="Valor Declarado" type="number" value={guide.declaredValue} disabled readOnly />
                                            <Input label="Seguro (%)" type="number" value={guide.insurancePercentage} onChange={e => setGuide(g => ({...g, insurancePercentage: Number(e.target.value)}))} />
                                        </div>
                                    )}
                                </div>
                                 <div className="pt-2 border-t dark:border-gray-700">
                                    <div className="flex items-center">
                                        <input
                                            id="discount"
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={guide.hasDiscount}
                                            onChange={e => setGuide(g => ({ ...g, hasDiscount: e.target.checked }))}
                                        />
                                        <label htmlFor="discount" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Aplicar Descuento</label>
                                    </div>
                                    {guide.hasDiscount && (
                                        <div className="mt-2">
                                            <Input
                                                label="Porcentaje de Descuento (%)"
                                                type="number"
                                                name="discountPercentage"
                                                value={guide.discountPercentage}
                                                onChange={e => setGuide(g => ({ ...g, discountPercentage: Number(e.target.value) }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                        <FinancialSummary financials={financials} guide={guide} bcvRate={companyInfo.bcvRate} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
