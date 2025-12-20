import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category, Product } from '@/data/mockProducts';

interface ProductContextType {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProduct: (id: string) => Promise<void>;
  reorderProducts: (products: Product[]) => Promise<void>;
  getProductsByCategory: (categoryId: string) => Product[];
  refetch: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (prodError) throw prodError;

      // Sempre usar dados do banco, mesmo se vazio
      setCategories((catData || []).map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '🍔',
        description: '',
        isActive: c.is_active ?? true,
      })));

      setProducts((prodData || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        image: p.image || '🍔',
        categoryId: p.category_id,
        tag: p.tag as Product['tag'],
        isAvailable: p.is_available ?? true,
        preparationTime: p.preparation_time || 15,
      })));
    } catch (err) {
      console.error('Error fetching products/categories:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const productsChannel = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .subscribe();

    const categoriesChannel = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...category, id: `cat_${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);

    try {
      const { error } = await supabase.from('categories').insert({
        name: category.name,
        icon: category.icon,
        is_active: category.isActive,
        sort_order: categories.length,
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error adding category:', err);
      setCategories(prev => prev.filter(c => c.id !== newCategory.id));
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { error } = await supabase.from('categories').update(updateData).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error updating category:', err);
      await fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    const backup = categories;
    setCategories(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting category:', err);
      setCategories(backup);
    }
  };

  const toggleCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) await updateCategory(id, { isActive: !category.isActive });
  };

  const reorderCategories = (newOrder: Category[]) => setCategories(newOrder);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: `prod_${Date.now()}` };
    setProducts(prev => [...prev, newProduct]);

    try {
      const { error } = await supabase.from('products').insert({
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category_id: product.categoryId,
        tag: product.tag,
        is_available: product.isAvailable,
        preparation_time: product.preparationTime || 15,
        sort_order: products.length,
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error adding product:', err);
      setProducts(prev => prev.filter(p => p.id !== newProduct.id));
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
      if (updates.tag !== undefined) updateData.tag = updates.tag;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
      if (updates.preparationTime !== undefined) updateData.preparation_time = updates.preparationTime;

      const { error } = await supabase.from('products').update(updateData).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error updating product:', err);
      await fetchData();
    }
  };

  const deleteProduct = async (id: string) => {
    const backup = products;
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting product:', err);
      setProducts(backup);
    }
  };

  const toggleProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) await updateProduct(id, { isAvailable: !product.isAvailable });
  };

  const reorderProducts = async (newOrder: Product[]) => {
    const backup = products;
    setProducts(newOrder);

    try {
      // Atualiza sort_order de cada produto
      const updates = newOrder.map((product, index) => 
        supabase.from('products').update({ sort_order: index }).eq('id', product.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Error reordering products:', err);
      setProducts(backup);
    }
  };

  const getProductsByCategory = (categoryId: string) => products.filter(p => p.categoryId === categoryId);

  return (
    <ProductContext.Provider
      value={{
        categories,
        products,
        isLoading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
        toggleCategory,
        reorderCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProduct,
        reorderProducts,
        getProductsByCategory,
        refetch: fetchData,
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
