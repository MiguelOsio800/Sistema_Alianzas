
import React from 'react';
import { Invoice, Client, Category, Office, ShippingType, PaymentMethod, CompanyInfo, User } from '../../types';
import InvoiceForm from './InvoiceForm';

interface EditInvoiceViewProps {
    invoice: Invoice;
    onSaveInvoice: (invoice: Invoice) => Promise<Invoice | null>;
    categories: Category[];
    clients: Client[];
    offices: Office[];
    shippingTypes: ShippingType[];
    paymentMethods: PaymentMethod[];
    companyInfo: CompanyInfo;
    currentUser: User;
}

const EditInvoiceView: React.FC<EditInvoiceViewProps> = (props) => {
    return (
        <div>
            <InvoiceForm
                invoice={props.invoice}
                onSave={props.onSaveInvoice}
                clients={props.clients}
                categories={props.categories}
                offices={props.offices}
                shippingTypes={props.shippingTypes}
                paymentMethods={props.paymentMethods}
                companyInfo={props.companyInfo}
                currentUser={props.currentUser}
            />
        </div>
    );
};

export default EditInvoiceView;
