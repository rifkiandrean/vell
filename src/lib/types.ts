

export type Spiciness = 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
export type SugarLevel = 'Less Sugar' | 'Normal' | 'Extra Sugar';

export type Topping = {
  id: string;
  name: string;
  price: number;
};

export type MenuItemCategory = 'Coffee Based' | 'Milk Based' | 'Juice' | 'Mocktail' | 'Food' | 'Desserts';

export type RecipeItem = {
  ingredientId: string; // Corresponds to InventoryItem's id
  quantity: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  image: string;
  customizations: {
    spiciness?: Spiciness[];
    toppings?: Topping[];
    sugarLevels?: SugarLevel[];
  };
  recipe?: RecipeItem[];
};

export type OrderItem = {
  id: string; // Unique ID for this specific order item instance
  menuItem: MenuItem;
  quantity: number;
  customizations: {
    spiciness?: Spiciness;
    sugarLevel?: SugarLevel;
    toppings: Topping[];
  };
  totalPrice: number;
};

export type OrderStatus = 'Idle' | 'Pending Payment' | 'Placed' | 'Preparing' | 'Served' | 'Delivered' | 'New Order';
export type PaymentMethod = 'Cash' | 'Online' | 'Transfer';

export type OrderData = {
  id?: string; // Optional because it's the document ID
  items: {
    name: string;
    quantity: number;
    price: number;
    customizations: {
      spiciness?: Spiciness | null;
      sugarLevel?: SugarLevel | null;
      toppings: string;
    };
  }[];
  subtotal: number;
  ppnAmount: number;
  serviceChargeAmount: number;
  total: number;
  status: OrderStatus;
  createdAt: any; // serverTimestamp()
  completedAt?: any; // serverTimestamp()
  tableNumber?: string | null;
  customerName?: string;
  whatsappNumber?: string;
  paymentMethod?: PaymentMethod;
  itemsPreparedByKitchen?: string[]; // Array of item names
  itemsPreparedByBarista?: string[]; // Array of item names
};

export type InventoryItem = {
  id: string;
  name:string;
  stock: number;
  unit: string;
  price?: number; // Add price per unit for cost calculation
};

export type ExpenseItem = {
    id: string;
    name: string;
    amount: number;
    date: any; // Firestore Timestamp
};

export type Vendor = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
};

export type PurchaseOrderItem = {
    itemId: string; // ID from inventory (gudang)
    name: string;
    quantity: number;
    unit: string;
    price: number; // price per unit for this PO
};

export type PurchaseOrderStatus = 'Draft' | 'Pending Approval' | 'Ordered' | 'Paid' | 'Payment Rejected' | 'Completed';

export type PurchaseOrder = {
    id: string;
    vendorId: string;
    vendorName: string;
    orderDate: any; // Firestore Timestamp
    receivedDate?: any; // Firestore Timestamp
    items: PurchaseOrderItem[];
    totalAmount: number;
    status: PurchaseOrderStatus;
    notes?: string;
};

// --- Settings related types ---
export type CompanyInfo = {
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  ersLogoUrl?: string;
  websiteVersion?: string;
  managerSignatureUrl?: string;
  spvSignatureUrl?: string;
};

export type PromoSettings = {
    promoBannerEnabled?: boolean;
    promoBannerBackgroundUrl?: string;
}

export type PromoSlide = {
    id: string;
    title: string;
    description: string;
    productImageUrl: string;
    linkUrl?: string;
    order: number;
    createdAt: any;
};


export type NotificationSettings = {
  soundEnabled: boolean;
  soundUrl: string;
  volume: number;
};

export type TaxSettings = {
    ppn: number; // Percentage
    serviceCharge: number; // Percentage
};


export type MenuCategorySetting = {
  id: string;
  name: MenuItemCategory;
  label: string;
  icon: string; // Name of the lucide-react icon
  visible: boolean;
  order: number;
};

export type Schedule = {
    monday: string;
    tuesday: string;
    wednesday: string;
thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
}

export type ShopStatus = {
    isOpen: boolean;
    schedule: Schedule;
}


export type TableStatus = 'Available' | 'Occupied' | 'Needs Cleanup' | 'Unavailable';

export type TableData = {
    id: string; // The table number, e.g., "meja 1"
    status: TableStatus;
    currentOrderId?: string | null;
    customerName?: string | null;
    lastActivity: any; // Firestore Timestamp
};

export type ActivityLog = {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: any; // Firestore Timestamp
    details?: Record<string, any>;
};
    
export type StoryTimelineItem = {
    date: string;
    title: string;
    description: string;
};

export type WeddingInfo = {
    brideName: string;
    groomName: string;
    brideBio: string;
    groomBio: string;
    brideStoryUrl?: string;
    groomStoryUrl?: string;
    ceremonyDate: string;
    ceremonyTime: string;
    ceremonyLocation: string;
    ceremonyMapUrl: string;
    receptionDate: string;
    receptionTime: string;
    receptionLocation: string;
    receptionMapUrl: string;
    isMusicEnabled?: boolean;
    backgroundMusicUrl?: string;
    invitedFamilies?: string[];
    coverImageUrl?: string;
    storyTimeline?: StoryTimelineItem[];
    coverFont?: string;
};

export type GalleryImage = {
  id: string;
  imageUrl: string;
  createdAt: any; // Firestore Timestamp
};


// --- VELL Landing Page Types ---
export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageHint: string;
  order: number;
};

export type PricingPackage = {
  id: string;
  name: string;
  price: number;
  pricePeriod: 'sekali bayar' | 'per bulan' | 'per tahun';
  features: string[]; // Features can be prefixed with '!' to denote exclusion
  isPopular: boolean;
  order: number;
};

export type LandingPageContent = {
  websiteTitle?: string;
  brandName?: string;
  vellLogoUrl?: string;
  productsSectionTitle?: string;
  productsSectionSubtitle?: string;
  
  product1Title?: string;
  product1Description?: string;
  product1IconUrl?: string;
  product1Link?: string;

  product2Title?: string;
  product2Description?: string;
  product2IconUrl?: string;
  product2Link?: string;
  
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramIconUrl?: string;
  tiktokIconUrl?: string;
  facebookIconUrl?: string;
  twitterIconUrl?: string;
};

// --- VELL Post Types ---
export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
};
