'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Modal } from '@/components/ui/modal';
import { IconPlus } from '@tabler/icons-react';
import { ProductTable } from './product-tables';
import { columns, MenuItem } from './product-tables/columns';
import ProductForm from './product-form';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  description: string | null;
}

interface MasterVariant {
  id: string;
  name: string;
  description: string | null;
}

interface ProductClientProps {
  products: MenuItem[];
  categories: Category[];
  tags: Tag[];
  masterVariants: MasterVariant[];
  totalItems: number;
}

export default function ProductClient({ products, categories, tags, masterVariants, totalItems }: ProductClientProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSuccess = () => {
    setIsAddOpen(false);
    router.refresh();
  };

  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='flex items-start justify-between'>
        <Heading
          title='Products'
          description='Manage food and beverage menu items.'
        />
        <Button
          onClick={() => setIsAddOpen(true)}
          className='shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 text-xs md:text-sm'
        >
          <IconPlus className='mr-2 h-4 w-4' /> Add New
        </Button>
      </div>
      <Separator />
      
      <ProductTable
        data={products}
        totalItems={totalItems}
        columns={columns}
      />


      <Modal
        title='Create Product'
        description='Add a new product to your menu.'
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <ProductForm
          initialData={null}
          categories={categories}
          tags={tags}
          masterVariants={masterVariants}
          pageTitle='Create New Product'
          isModal={true}
          onSuccess={handleSuccess}
        />
      </Modal>
    </div>
  );
}
