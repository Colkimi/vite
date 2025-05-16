
import type { Product } from './product.interface';

export interface Database {
    getProducts(): Promise<Product[]>;
    addProduct(product: Product): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    deleteProduct(id: number): Promise<void>;
    getProductById(id: number): Promise<Product | null>;
}



 