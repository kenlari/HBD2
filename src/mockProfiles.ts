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

export const MOCK_EXTERNAL_PROFILES: MockProfile[] = [
  {
    id: "clara",
    name: "Aunt Clara",
    username: "cozy_clara_99",
    phone: "+1 (555) 832-1920",
    birthday: "1972-11-12",
    age: "54",
    avatar: "bg-pink-500",
    interests: ["Baking Cakes", "Gardening", "Tea Blending", "Knitting"],
    wishlistToPost: [
      {
        id: "clara-w1",
        title: "Vintage Porcelain Tea Set (Blue Floral)",
        price: "$45.00",
        url: "https://example.com/blue-tea-set",
        isClaimed: false
      },
      {
        id: "clara-w2",
        title: "Organic Chamomile Lavender Tea Selection Box",
        price: "$18.50",
        url: "https://example.com/lavender-tea",
        isClaimed: false
      }
    ]
  },
  {
    id: "david",
    name: "David Miller (Brother)",
    username: "miller_time_bro",
    phone: "+1 (555) 234-9043",
    birthday: "1993-09-08",
    age: "33",
    avatar: "bg-emerald-500",
    interests: ["Barbecue Smokehouse", "Classic Cars", "Rock Music", "Fine Leather Crafts"],
    wishlistToPost: [
      {
        id: "david-w1",
        title: "Dual-Probe Smart Bluetooth Meat Thermometer",
        price: "$69.00",
        url: "https://example.com/thermometer",
        isClaimed: false
      },
      {
        id: "david-w2",
        title: "Heritage Whiskey Tumblers (Set of 4)",
        price: "$35.00",
        url: "https://example.com/tumblers",
        isClaimed: false
      }
    ]
  },
  {
    id: "elena",
    name: "Elena Rodriguez",
    username: "elena_zen",
    phone: "+1 (555) 304-2900",
    birthday: "1994-10-31",
    age: "32",
    avatar: "bg-amber-500",
    interests: ["Vinyasa Yoga", "Zen Meditation", "Juice Blending", "Eco-friendly Fashion"],
    wishlistToPost: [
      {
        id: "elena-w1",
        title: "Organic Cork Non-Slip Yoga Mat (8mm)",
        price: "$48.00",
        url: "https://example.com/yoga-mat",
        isClaimed: false
      },
      {
        id: "elena-w2",
        title: "Essential Oil Ultrasonic Diffuser",
        price: "$29.99",
        url: "https://example.com/diffuser",
        isClaimed: false
      }
    ]
  },
  {
    id: "sam",
    name: "Sam Wilson",
    username: "star_ranger_sam",
    phone: "+1 (555) 678-2345",
    birthday: "1991-03-14",
    age: "35",
    avatar: "bg-indigo-500",
    interests: ["Mountain Hiking", "Stargazing Astronomy", "Acoustic Guitar", "Landscape Painting"],
    wishlistToPost: [
      {
        id: "sam-w1",
        title: "Refractor Astronomy Telescope with Tripod",
        price: "$119.00",
        url: "https://example.com/telescope",
        isClaimed: false
      },
      {
        id: "sam-w2",
        title: "Premium 30L Waterproof Hiking Daypack",
        price: "$42.00",
        url: "https://example.com/hiking-bag",
        isClaimed: false
      }
    ]
  },
  {
    id: "zoe",
    name: "Zoe Vance",
    username: "biker_zoe",
    phone: "+1 (555) 901-4432",
    birthday: "1998-12-05",
    age: "27",
    avatar: "bg-fuchsia-500",
    interests: ["Mountain Cycling", "GoPro Video Recording", "Organic Energy Bars", "Cold Camping Gear"],
    wishlistToPost: [
      {
        id: "zoe-w1",
        title: "High-Capacity 25000mAh Power Bank",
        price: "$39.00",
        url: "https://example.com/battery-pack",
        isClaimed: false
      },
      {
        id: "zoe-w2",
        title: "GoPro Lens Protective Glass Wrap Filter",
        price: "$19.99",
        url: "https://example.com/lens-go-pro",
        isClaimed: false
      }
    ]
  },
  {
    id: "piet",
    name: "Piet van Deventer",
    username: "coffee_nerd_piet",
    phone: "+31 6 1234 5678",
    birthday: "2000-01-22",
    age: "26",
    avatar: "bg-teal-500",
    interests: ["La Marzocco Mods", "Specialty Ceramic Glazes", "Smooth Jazz Records", "Single-Origin Beans"],
    wishlistToPost: [
      {
        id: "piet-w1",
        title: "Fellow Atmos Vacuum Storage Canister (0.7L)",
        price: "$35.00",
        url: "https://example.com/atmos-canister",
        isClaimed: false
      },
      {
        id: "piet-w2",
        title: "Glazed Speckled Coffee Mug (Handcrafted)",
        price: "$24.00",
        url: "https://example.com/handcrafted-mug",
        isClaimed: false
      }
    ]
  }
];
