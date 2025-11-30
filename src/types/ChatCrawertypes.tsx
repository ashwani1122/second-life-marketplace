export type ChatDrawerProps = {
    chatOpen: boolean;
    sellerName?: string | null;
    buyerName?: string | null;
    sellerAvatarUrl?: string | null; // Added seller avatar
    productTitle?: string | null;
    messages: any[];
    messagesRef: React.RefObject<HTMLDivElement | null>;
    messageText: string;
    setMessageText: (s: string) => void;
    onSendMessage: (
        content?: string,
        attachmentUrl?: string | null
    ) => Promise<void>;
    onAttachFile: (file: File | null) => Promise<void>;
    onClose: () => void;
    typingUsers: Record<string, number>;
    currentUserId: string | null;
    sending: boolean;
    attachmentUploading: boolean;
};