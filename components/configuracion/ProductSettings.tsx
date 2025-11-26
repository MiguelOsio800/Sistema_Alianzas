import React, { useState } from 'react';
import { Product } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { PlusIcon, EditIcon, TrashIcon, PackageIcon } from '../icons/Icons';

const ProductFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    product: Partial<Product> | null;
}> = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState<Partial<Product>>({});

    React.useEffect(() => {
        if (isOpen) {
            setFormData(product || { name: '', description: '' });
        }
    }, [product, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Product);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product?.id ? 'Editar Producto' : 'Nuevo Producto'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre del Producto" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                <Input label="Descripción" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};


interface ProductSettingsProps {
    products: Product[];
    onSave: (product: Product) => void;
    onDelete: (id: string) => void;
}

const ProductSettings: React.FC<ProductSettingsProps> = ({ products, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    const handleOpenModal = (product?: Product) => {
        setEditingProduct(product || null);
        setIsModalOpen(true);
    };

    const handleSave = (product: Product) => {
        onSave(product);
        setIsModalOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <PackageIcon className="w-6 h-6 mr-3 text-primary-500"/>
                            <CardTitle>Gestión de Productos</CardTitle>
                        </div>
                        <Button onClick={() => handleOpenModal()}>
                            <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Producto
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {products.map(prod => (
                                <tr key={prod.id}>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{prod.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{prod.description}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(prod)}><EditIcon className="w-4 h-4"/></Button>
                                        <Button variant="danger" size="sm" onClick={() => onDelete(prod.id)}><TrashIcon className="w-4 h-4"/></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                product={editingProduct}
            />
        </>
    );
};

export default ProductSettings;
