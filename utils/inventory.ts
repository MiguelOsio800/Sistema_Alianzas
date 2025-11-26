
import { Invoice, InventoryItem } from './types';

export const deriveInventoryFromInvoices = (invoices: Invoice[]): InventoryItem[] => {
    const inventory: InventoryItem[] = [];
    invoices.forEach(invoice => {
        // Inventory should only contain items from active invoices that haven't been delivered yet
        if (invoice.status === 'Activa' && invoice.shippingStatus !== 'Entregada') {
            invoice.guide.merchandise.forEach((item, index) => {
                const realWeight = Number(item.weight) || 0;
                const volumetricWeight = (Number(item.length) * Number(item.width) * Number(item.height)) / 5000;
                const chargeableWeight = Math.max(realWeight, volumetricWeight) * (Number(item.quantity) || 1);

                inventory.push({
                    id: `${invoice.id}-${index}`,
                    sku: `SKU-${invoice.id.slice(-4)}-${index}`, // Generate a simple SKU
                    name: item.description,
                    description: `Parte de la factura ${invoice.invoiceNumber}`,
                    stock: item.quantity,
                    unit: 'unidad', // Defaulting to unidad
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    shippingStatus: invoice.shippingStatus,
                    weight: chargeableWeight,
                });
            });
        }
    });
    return inventory;
};
