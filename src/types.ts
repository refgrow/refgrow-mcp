/**
 * TypeScript types for Refgrow MCP Server
 */

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

// --- Affiliate Types ---

export interface Affiliate {
  id: number;
  user_email: string;
  referral_code: string;
  created_at: string;
  status: "active" | "inactive";
  clicks: number;
  signups: number;
  purchases: number;
  total_earnings: string;
  unpaid_earnings: string;
  partner_slug?: string | null;
}

export interface CreateAffiliateInput {
  email: string;
  referral_code?: string;
  partner_slug?: string;
}

export interface UpdateAffiliateInput {
  email?: string;
  referral_code?: string;
  status?: "active" | "inactive";
  partner_slug?: string;
}

// --- Referral Types ---

export interface Referral {
  id: number;
  user_email: string;
  conversion_status: "pending" | "converted" | "direct" | "direct_signup";
  conversion_date: string | null;
  created_at: string;
  affiliate_id: number | null;
  affiliate_code: string | null;
}

export interface CreateReferralInput {
  email: string;
  affiliate_id?: number;
  status?: "pending" | "converted" | "direct" | "direct_signup";
}

// --- Conversion Types ---

export interface Conversion {
  id: number;
  project_id: number;
  value: number;
  base_value: number | null;
  type: "signup" | "purchase";
  affiliate_id: number | null;
  referred_user_id: number | null;
  paid: boolean;
  reference: string | null;
  coupon_code_used: string | null;
  base_value_currency: string | null;
  created_at: string;
  referral_code: string | null;
  url: string | null;
}

export interface CreateConversionInput {
  type: "signup" | "purchase";
  value?: number;
  base_value?: number;
  affiliate_id?: number;
  referred_user_id?: number;
  referral_code?: string;
  paid?: boolean;
  reference?: string;
  coupon_code_used?: string;
  base_value_currency?: string;
  email?: string;
}

// --- Coupon Types ---

export interface Coupon {
  id: number;
  project_id: number;
  affiliate_id: number;
  coupon_code: string;
  stripe_coupon_id: string | null;
  lemonsqueezy_discount_code: string | null;
  status: "active" | "inactive";
  created_at: string;
  affiliate_email: string;
  affiliate_referral_code: string;
}

export interface CreateCouponInput {
  affiliate_id: number;
  coupon_code: string;
  stripe_coupon_id?: string;
  lemonsqueezy_discount_code?: string;
  status?: "active" | "inactive";
}

// --- Config ---

export interface RefgrowConfig {
  apiKey: string;
  baseUrl: string;
}
