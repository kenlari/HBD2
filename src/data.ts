import { Friend } from "./types";

export const INITIAL_FRIENDS: Friend[] = [
  {
    id: "alex",
    name: "Alex Patel (You)",
    birthday: "1997-06-25", // Birthday is coming up soon!
    relationship: "Self",
    age: "29",
    interests: ["Photography", "Specialty Coffee", "Cyberpunk Novels", "Mechanic Keyboards"],
    avatar: "bg-teal-500",
    connectedBack: true,
    wishlist: [],
    achievements: []
  }
];

export const ALL_ACHIEVEMENTS_LIST = [
  {
    title: "Wishlist Wiz",
    description: "Added 5 items or more securely to your wishlist directory.",
    iconName: "Sparkles",
  },
  {
    title: "Locket Pioneer",
    description: "Customized a live picture widget showcase showcasing your best buddy.",
    iconName: "Smartphone",
  },
  {
    title: "Gemini Genie",
    description: "Requested personalized AI recommendations for a friend's interests.",
    iconName: "Brain",
  },
  {
    title: "Perfect Wishlist",
    description: "Added at least 3 items with prices for your friends to see.",
    iconName: "Gift",
  },
  {
    title: "Generous Giver",
    description: "Claimed a gift off a friend's wishlist to make their birthday special.",
    iconName: "Heart",
  },
  {
    title: "Early Bird Reminded",
    description: "Created birthday alerts for upcoming occurrences.",
    iconName: "Calendar",
  }
];
