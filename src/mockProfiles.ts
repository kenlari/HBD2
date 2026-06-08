import { Friend, WishlistItem } from "./types";

export interface MockProfile {
  id: string;
  name: string;
  username: string;
  phone: string;
  birthday: string;
  age: string;
  avatar: string;
  interests: string[];
  wishlistToPost: WishlistItem[];
}

export const MOCK_EXTERNAL_PROFILES: MockProfile[] = [];
