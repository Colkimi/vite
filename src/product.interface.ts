// movie.interface.ts
export interface Product {
    id: number;           
    item_count?: number;        // Optional as it's auto-generated
    individual_price: number;
    items_seleced: number;
    name: string;
    category: string;
    image: string;
}