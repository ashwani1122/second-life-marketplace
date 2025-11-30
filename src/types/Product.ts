export interface Product {
    id: string;
    title: string;
    description: string;
    reason_for_selling: string;
    price: number;
    location: string;
    purchase_date: string | null;
    status: string | null;
    seller_id?: string | null;
    image_url?: string[] | null;
}
