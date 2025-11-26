import React, { useMemo } from 'react';
import { Invoice, CompanyInfo, Client, Category } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { calculateFinancialDetails } from '../../utils/financials';
import { WhatsAppIcon } from '../icons/Icons';

interface WhatsAppShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice;
    companyInfo: CompanyInfo;
    clients: Client[];
    categories: Category[]; // Kept for prop compatibility, though not used in the new version
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({ isOpen, onClose, invoice, companyInfo, clients }) => {
    
    const message = useMemo(() => {
        if (!invoice) return '';
        
        const sender = clients.find(c => c.id === invoice.guide.sender.id || c.idNumber === invoice.guide.sender.idNumber) || invoice.guide.sender;
        const receiver = clients.find(c => c.id === invoice.guide.receiver.id || c.idNumber === invoice.guide.receiver.idNumber) || invoice.guide.receiver;
        const financials = calculateFinancialDetails(invoice.guide, companyInfo);

        const merchandiseList = invoice.guide.merchandise
            .map(item => `- ${item.quantity} x ${item.description}`)
            .join('\n');

        const parts = [
            `*FACTURA - ${companyInfo.name}*`,
            `RIF: ${companyInfo.rif}`,
            ``,
            `*N° Factura:* ${invoice.invoiceNumber}`,
            `*Fecha:* ${invoice.date}`,
            ``,
            `*Remitente:*`,
            `Nombre: ${sender.name}`,
            `CI/RIF: ${sender.idNumber}`,
            ``,
            `*Destinatario:*`,
            `Nombre: ${receiver.name}`,
            `CI/RIF: ${receiver.idNumber}`,
            ``,
            `--- *Mercancía* ---`,
            merchandiseList,
            ``,
            `--- *Resumen Financiero* ---`,
            `Monto del Flete: ${formatCurrency(financials.freight)}`,
        ];

        if (financials.insuranceCost > 0) parts.push(`Seguro: ${formatCurrency(financials.insuranceCost)}`);
        if (financials.handling > 0) parts.push(`Manejo: ${formatCurrency(financials.handling)}`);
        if (financials.discount > 0) parts.push(`Descuento: -${formatCurrency(financials.discount)}`);
        
        parts.push(`*Subtotal:* ${formatCurrency(financials.subtotal)}`);
        parts.push(`IVA (16%): ${formatCurrency(financials.iva)}`);
        
        if (financials.ipostel > 0) parts.push(`Ipostel: ${formatCurrency(financials.ipostel)}`);
        if (financials.igtf > 0) parts.push(`IGTF (3%): ${formatCurrency(financials.igtf)}`);
        
        parts.push(`*Total a Pagar:* *${formatCurrency(financials.total)}*`);
        parts.push(``);
        parts.push(`Gracias por su preferencia.`);

        return parts.join('\n');

    }, [invoice, companyInfo, clients]);


    const handleShare = () => {
        const encodedMessage = encodeURIComponent(message);
        
        const receiverClient = clients.find(c => c.id === invoice.guide.receiver.id || c.idNumber === invoice.guide.receiver.idNumber);
        const senderClient = clients.find(c => c.id === invoice.guide.sender.id || c.idNumber === invoice.guide.sender.idNumber);
        
        let phone = receiverClient?.phone || senderClient?.phone;

        let whatsappUrl = `https://wa.me/`;
        if (phone) {
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '58' + cleanPhone.substring(1);
            } else if (cleanPhone.length === 10 && cleanPhone.startsWith('4')) {
                 cleanPhone = '58' + cleanPhone;
            }
            whatsappUrl += `${cleanPhone}`;
        }
        whatsappUrl += `?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compartir Detalles de Factura por WhatsApp">
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Vista Previa del Mensaje:</h3>
                <div className="p-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 max-h-60 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">{message}</pre>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Se abrirá WhatsApp con este mensaje pre-cargado. Podrá editarlo antes de enviar.
                </p>
                <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                     <Button onClick={handleShare} className="w-full sm:w-auto !bg-green-500 hover:!bg-green-600 text-white">
                        <WhatsAppIcon className="w-5 h-5 mr-2" /> Enviar por WhatsApp
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default WhatsAppShareModal;