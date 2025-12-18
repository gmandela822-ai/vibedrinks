import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull().unique(),
  role: text("role").notNull().default("customer"),
  password: text("password"),
  isBlocked: boolean("is_blocked").default(false),
  requiresPasswordChange: boolean("requires_password_change").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  notes: text("notes"),
  isDefault: boolean("is_default").default(true),
});

export const categories = pgTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  categoryId: varchar("category_id", { length: 36 }).notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").default(true),
  isPrepared: boolean("is_prepared").default(false),
  comboEligible: boolean("combo_eligible").default(false),
  productType: text("product_type"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  addressId: varchar("address_id", { length: 36 }).references(() => addresses.id),
  orderType: text("order_type").notNull().default("delivery"),
  status: text("status").notNull().default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  originalDeliveryFee: decimal("original_delivery_fee", { precision: 10, scale: 2 }),
  deliveryFeeAdjusted: boolean("delivery_fee_adjusted").default(false),
  deliveryFeeAdjustedAt: timestamp("delivery_fee_adjusted_at"),
  deliveryDistance: decimal("delivery_distance", { precision: 10, scale: 2 }),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  changeFor: decimal("change_for", { precision: 10, scale: 2 }),
  notes: text("notes"),
  customerName: text("customer_name"),
  salesperson: text("salesperson"),
  motoboyId: varchar("motoboy_id", { length: 36 }).references(() => motoboys.id),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  preparingAt: timestamp("preparing_at"),
  readyAt: timestamp("ready_at"),
  dispatchedAt: timestamp("dispatched_at"),
  arrivedAt: timestamp("arrived_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const banners = pgTable("banners", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const motoboys = pgTable("motoboys", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull().unique(),
  photoUrl: text("photo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockLogs = pgTable("stock_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  change: integer("change").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeAddress: text("store_address"),
  storeLat: decimal("store_lat", { precision: 10, scale: 7 }),
  storeLng: decimal("store_lng", { precision: 10, scale: 7 }),
  deliveryRatePerKm: decimal("delivery_rate_per_km", { precision: 10, scale: 2 }).default("1.25"),
  minDeliveryFee: decimal("min_delivery_fee", { precision: 10, scale: 2 }).default("5.00"),
  maxDeliveryDistance: decimal("max_delivery_distance", { precision: 10, scale: 2 }).default("15"),
  pixKey: text("pix_key"),
  openingHours: jsonb("opening_hours"),
  isOpen: boolean("is_open").default(true),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 5 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  zoneId: varchar("zone_id", { length: 36 }).notNull().references(() => deliveryZones.id),
  isActive: boolean("is_active").default(true),
});

export const trendingProducts = pgTable("trending_products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id).unique(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetRequests = pgTable("password_reset_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  userName: text("user_name").notNull(),
  userWhatsapp: text("user_whatsapp").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by", { length: 36 }),
});

export const preparationIngredients = pgTable("preparation_ingredients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderItemId: varchar("order_item_id", { length: 36 }).notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  ingredientProductId: varchar("ingredient_product_id", { length: 36 }).notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shoppingLists = pgTable("shopping_lists", {
  id: varchar("id", { length: 36 }).primaryKey(),
  status: text("status").notNull().default("active"),
  totalItems: integer("total_items").notNull().default(0),
  purchasedItems: integer("purchased_items").notNull().default(0),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  purchasedCost: decimal("purchased_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const shoppingListItems = pgTable("shopping_list_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  listId: varchar("list_id", { length: 36 }).notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  categoryName: text("category_name").notNull(),
  suggestedQuantity: integer("suggested_quantity").notNull(),
  actualQuantity: integer("actual_quantity"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  isPurchased: boolean("is_purchased").default(false),
  purchasedAt: timestamp("purchased_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, acceptedAt: true, preparingAt: true, readyAt: true, dispatchedAt: true, arrivedAt: true, deliveredAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
export const insertMotoboySchema = createInsertSchema(motoboys).omit({ id: true, createdAt: true });
export const insertStockLogSchema = createInsertSchema(stockLogs).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).omit({ id: true });
export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({ id: true });
export const insertTrendingProductSchema = createInsertSchema(trendingProducts).omit({ id: true, createdAt: true });
export const insertPasswordResetRequestSchema = createInsertSchema(passwordResetRequests).omit({ id: true, createdAt: true, completedAt: true, completedBy: true });
export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({ id: true, createdAt: true, completedAt: true });
export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({ id: true, purchasedAt: true });
export const insertPreparationIngredientSchema = createInsertSchema(preparationIngredients).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertMotoboy = z.infer<typeof insertMotoboySchema>;
export type Motoboy = typeof motoboys.$inferSelect;
export type InsertStockLog = z.infer<typeof insertStockLogSchema>;
export type StockLog = typeof stockLogs.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertTrendingProduct = z.infer<typeof insertTrendingProductSchema>;
export type TrendingProduct = typeof trendingProducts.$inferSelect;
export type InsertPasswordResetRequest = z.infer<typeof insertPasswordResetRequestSchema>;
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertPreparationIngredient = z.infer<typeof insertPreparationIngredientSchema>;
export type PreparationIngredient = typeof preparationIngredients.$inferSelect;

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
  isComboItem?: boolean;
  comboId?: string;
};

export type ComboGelo = {
  product: Product;
  quantity: number;
};

export type ComboData = {
  id: string;
  destilado: Product;
  energetico: Product;
  energeticoQuantity: number;
  gelos: ComboGelo[];
  discountPercent: number;
  originalTotal: number;
  discountedTotal: number;
};

export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "dispatched" | "arrived" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Aguardando",
  accepted: "Aceito",
  preparing: "Em produção",
  ready: "Pronto",
  dispatched: "Despachado",
  arrived: "Cheguei",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export type PaymentMethod = "cash" | "pix" | "card_pos" | "card_credit" | "card_debit";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  card_pos: "Cartao (POS)",
  card_credit: "Credito",
  card_debit: "Debito",
};

export type OrderType = "delivery" | "counter";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Delivery",
  counter: "Balcao",
};

export type Salesperson = "balconista_1" | "balconista_2" | "balconista_3" | "balconista_4";

export const SALESPERSON_LABELS: Record<Salesperson, string> = {
  balconista_1: "Balconista 1",
  balconista_2: "Balconista 2",
  balconista_3: "Balconista 3",
  balconista_4: "Balconista 4",
};

export const PREPARED_CATEGORIES = [
  "CAIPIRINHAS",
  "DOSES",
  "BATIDAS",
  "COPAO",
  "DRINKS ESPECIAIS",
  "CAIPI ICES",
  "DRINKS",
  "COPOS",
];

export function isPreparedCategoryName(categoryName: string): boolean {
  const normalizedName = categoryName.toUpperCase().trim();
  return PREPARED_CATEGORIES.some(cat => 
    normalizedName === cat || 
    normalizedName.includes(cat) || 
    cat.includes(normalizedName)
  );
}
