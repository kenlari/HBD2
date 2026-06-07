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
    wishlist: [
      {
        id: "alexw-1",
        title: "60% Custom Hot-Swappable Mechanical Keyboard",
        price: "$85.00",
        url: "https://example.com/keyboard",
        isClaimed: false
      },
      {
        id: "alexw-2",
        title: "Single-Origin Ethiopian Coffee Beans (250g)",
        price: "$22.00",
        url: "https://example.com/beans",
        isClaimed: false
      },
      {
        id: "alexw-3",
        title: "Reusable Analog 35mm Film Camera",
        price: "$35.50",
        url: "https://example.com/camera",
        isClaimed: true,
        claimedBy: "Jamie Chen"
      }
    ],
    achievements: [
      {
        id: "ach-1",
        title: "Perfect Wishlist",
        description: "Added at least 3 items with prices for your friends to see.",
        iconName: "Gift",
        dateAwarded: "2026-05-12"
      },
      {
        id: "ach-2",
        title: "Locket Pioneer",
        description: "Set up a lock screen widget displaying your best friend's profile.",
        iconName: "Smartphone",
        dateAwarded: "2026-05-30"
      }
    ]
  },
  {
    id: "jamie",
    name: "Jamie Chen",
    birthday: "1999-04-18",
    relationship: "Best Friend",
    age: "27",
    interests: ["Watercolor Painting", "Matcha Latte", "Cozy Indie Games", "Thrift Shopping"],
    avatar: "bg-fuchsia-500",
    connectedBack: true,
    wishlist: [
      {
        id: "jamiew-1",
        title: "Premium Watercolor travel brush set",
        price: "$32.00",
        url: "https://example.com/watercolor",
        isClaimed: false
      },
      {
        id: "jamiew-2",
        title: "Ceramic Matcha Bowl and bamboo whisk",
        price: "$28.00",
        url: "https://example.com/matcha",
        isClaimed: true,
        claimedBy: "Alex Patel (You)"
      }
    ],
    achievements: [
      {
        id: "ach-3",
        title: "Generous Giver",
        description: "Claimed a gift off a friend's wishlist.",
        iconName: "Heart",
        dateAwarded: "2026-04-02"
      }
    ]
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    birthday: "1995-11-20",
    relationship: "College Friend",
    age: "31",
    interests: ["Trail Running", "Sci-Fi Podcasts", "Arduino Coding", "Spicy Foods"],
    avatar: "bg-indigo-500",
    connectedBack: false,
    wishlist: [
      {
        id: "jordanw-1",
        title: "Hydration Running Vest (5L pack)",
        price: "$45.00",
        url: "https://example.com/running",
        isClaimed: false
      },
      {
        id: "jordanw-2",
        title: "Arduino Starter Kit with Tutorial Book",
        price: "$39.99",
        url: "https://example.com/arduino",
        isClaimed: false
      }
    ],
    achievements: [
      {
        id: "ach-4",
        title: "Birthday Legend",
        description: "Filled out birthday details and interest tags.",
        iconName: "Smile",
        dateAwarded: "2026-01-15"
      }
    ]
  },
  {
    id: "taylor",
    name: "Taylor Vance",
    birthday: "1998-06-12", // Birthday is coming up extremely soon!
    relationship: "Work Colleague",
    age: "28",
    interests: ["Retro Vinyl", "Electric Skateboards", "Houseplants", "Pour Over Brews"],
    avatar: "bg-amber-500",
    connectedBack: false,
    wishlist: [
      {
        id: "taylorw-1",
        title: "Classic Retro Saffron Bonsai Pot",
        price: "$19.00",
        url: "https://example.com/bonsai",
        isClaimed: true,
        claimedBy: "Jordan Lee"
      },
      {
        id: "taylorw-2",
        title: "Vintage Vinyl: Fleetwood Mac Rumours",
        price: "$30.00",
        url: "https://example.com/vinyl",
        isClaimed: false
      }
    ],
    achievements: [
      {
        id: "ach-5",
        title: "Early Bird Reminded",
        description: "Created birthday alerts for upcoming occurrences.",
        iconName: "Calendar",
        dateAwarded: "2026-05-20"
      }
    ]
  },
  {
    id: "riley",
    name: "Riley Cooper",
    birthday: "1996-07-08", // Birthday is also coming up soon!
    relationship: "Gym Partner",
    age: "30",
    interests: ["Baking Sourdough", "Gym Lifting", "Espresso Gear", "Cinematography"],
    avatar: "bg-rose-500",
    connectedBack: false,
    wishlist: [
      {
        id: "rileyw-1",
        title: "Durable Cast Iron Dutch Oven (5 Qt)",
        price: "$59.00",
        url: "https://example.com/dutchoven",
        isClaimed: false
      },
      {
        id: "rileyw-2",
        title: "Professional Sourdough Proofing Baskets",
        price: "$24.50",
        url: "https://example.com/proofing",
        isClaimed: false
      },
      {
        id: "rileyw-3",
        title: "Stainless Steel Coffee Tamper (58.5mm)",
        price: "$18.00",
        url: "https://example.com/tamper",
        isClaimed: false
      }
    ],
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
