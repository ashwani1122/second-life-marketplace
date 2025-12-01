export interface ChatListItem {
    id: string;
    product_id: string;
    product_title: string;
    partner_name: string;
    last_message_content?: string;
    last_message_time: string;
    is_unread: boolean;
    productStatus?: string;
}