export interface User{
    id: string;  // UUID
    email?: string;
    username: string;
    first_name: string;
    last_name: string;
    profile_img?: string | null;
    avatar_url?: string | null;
}

export interface Message{
    id: number;
    conversation_id?: number;
    sender: User;
    content: string;
    timestamp: string;
    is_read: boolean;
    attachment_name?: string;
    attachment_size?: number | null;
    attachment_content_type?: string;
    has_attachment?: boolean;
}

export interface Conversation{
    id: number;
    user1: User;
    user2: User;
    created_at: string;
    updated_at: string;
    last_message: Message | null;
    unread_count: number;
}
