export interface WishlistItem {
  id: string;
  title: string;
  price: string;
  url: string;
  isClaimed: boolean;
  claimedBy?: string; // name of the friend who claimed it
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string; // lucide icon identifier
  dateAwarded: string;
}

export interface Friend {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD
  interests: string[];
  avatar: string; // Tailwind color name or visual configuration
  wishlist: WishlistItem[];
  achievements: Achievement[];
  relationship: string; // e.g., Best Friend, Classmate, Work Colleague, Family
  age: string; // e.g. "25", "30"
  phone?: string;
  snapchat?: string;
  whatsapp?: string;
  email?: string;
  connectedBack?: boolean; // Must be true to view their private data
  incomingRequest?: boolean; // True if friend request is sent TO us and is pending accept
  requestType?: "friend_request" | "local_celebrant";
  notOnHbd?: boolean;
}

export interface GiftSuggestion {
  name: string;
  reason: string;
  estimatedPrice: string;
  category: string;
}

export interface WidgetPreset {
  id: string;
  platform: "ios" | "android";
  size: "small" | "medium" | "lockscreen";
  style: "minimal" | "cyber" | "locket" | "countdown";
  title: string;
}

export interface InAppNotification {
  id: string;
  type: "birthday_list_posted" | "system";
  title: string;
  message: string;
  friendId?: string;
  senderUid?: string;
  timestamp: string;
  isRead: boolean;
}

export interface SentGift {
  id: string;
  friendId: string;
  friendName: string;
  giftType: string;
  giftName: string;
  price: string;
  status: "Sent" | "Delivered" | "Scheduled" | string;
  message: string;
  dateSent: string;
  revealDate?: string;
  isOpened?: boolean;
}

export interface ReceivedGift {
  id: string;
  senderId: string;
  senderName: string;
  giftType: string;
  giftName: string;
  price: string;
  status: string;
  message: string;
  dateReceived: string;
  isOpened?: boolean;
}


