import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Category, Product, mockCategories, mockProducts } from '@/data/mockProducts';

interface ProductContextType {
  categories: Category[];
  products: Product[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  toggleCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  toggleProductPickup: (id: string) => void;
  getProductsByCategory: (categoryId: string) => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [products, setProducts] = useState<Product[]>(mockProducts.map(p => ({ ...p, allowPickup: true })));

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}`,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const toggleCategory = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const reorderCategories = (newOrder: Category[]) => {
    setCategories(newOrder);
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProduct = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
  };

  const toggleProductPickup = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, allowPickup: !(p as any).allowPickup } : p));
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId);
  };

  return (
    <ProductContext.Provider
      value={{
        categories,
        products,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategory,
        reorderCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProduct,
        toggleProductPickup,
        getProductsByCategory,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
