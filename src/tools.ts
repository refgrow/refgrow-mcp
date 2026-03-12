/**
 * Refgrow MCP Server - Tool Definitions
 *
 * Wraps the Refgrow REST API v1 endpoints as MCP tools.
 * API docs: https://refgrow.com/docs/api
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { RefgrowConfig, ApiResponse } from "./types.js";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function apiRequest<T = unknown>(
  config: RefgrowConfig,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  query?: Record<string, string | number | boolean | undefined>
): Promise<ApiResponse<T>> {
  const url = new URL(`/api/v1${path}`, config.baseUrl);

  if (query) {
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  // Handle 204 No Content (e.g. DELETE)
  if (response.status === 204) {
    return { success: true } as ApiResponse<T>;
  }

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(
      data.error || `API request failed with status ${response.status}`
    );
  }

  return data;
}

// ---------------------------------------------------------------------------
// Helper to format tool output
// ---------------------------------------------------------------------------

function textResult(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// Register all tools on the MCP server
// ---------------------------------------------------------------------------

export function registerTools(server: McpServer, config: RefgrowConfig): void {
  // -----------------------------------------------------------------------
  // 1. list_affiliates
  // -----------------------------------------------------------------------
  server.tool(
    "list_affiliates",
    "List all affiliates in your Refgrow project with their stats (clicks, signups, purchases, earnings). Supports filtering by status and pagination.",
    {
      status: z
        .enum(["active", "inactive"])
        .optional()
        .describe("Filter by affiliate status"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Number of results to return (default 100, max 500)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Pagination offset (default 0)"),
    },
    async ({ status, limit, offset }) => {
      try {
        const data = await apiRequest(config, "GET", "/affiliates", undefined, {
          status,
          limit,
          offset,
        });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 2. get_affiliate_details
  // -----------------------------------------------------------------------
  server.tool(
    "get_affiliate_details",
    "Get detailed information about a specific affiliate by their email address, including click count, signups, purchases, and earnings.",
    {
      email: z.string().email().describe("The affiliate's email address"),
    },
    async ({ email }) => {
      try {
        const encoded = encodeURIComponent(email);
        const data = await apiRequest(
          config,
          "GET",
          `/affiliates/${encoded}`
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 3. create_affiliate
  // -----------------------------------------------------------------------
  server.tool(
    "create_affiliate",
    "Create a new affiliate in your Refgrow project. An affiliate receives a unique referral code and can start referring customers.",
    {
      email: z.string().email().describe("Email address for the new affiliate"),
      referral_code: z
        .string()
        .optional()
        .describe(
          "Custom referral code (auto-generated if not provided)"
        ),
      partner_slug: z
        .string()
        .optional()
        .describe("Partner slug for URL tracking"),
    },
    async ({ email, referral_code, partner_slug }) => {
      try {
        const body: Record<string, unknown> = { email };
        if (referral_code) body.referral_code = referral_code;
        if (partner_slug) body.partner_slug = partner_slug;

        const data = await apiRequest(config, "POST", "/affiliates", body);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 4. update_affiliate
  // -----------------------------------------------------------------------
  server.tool(
    "update_affiliate",
    "Update an existing affiliate's details such as email, referral code, status, or partner slug.",
    {
      email: z
        .string()
        .email()
        .describe("Current email of the affiliate to update"),
      new_email: z
        .string()
        .email()
        .optional()
        .describe("New email address"),
      referral_code: z.string().optional().describe("New referral code"),
      status: z
        .enum(["active", "inactive"])
        .optional()
        .describe("New status"),
      partner_slug: z.string().optional().describe("New partner slug"),
    },
    async ({ email, new_email, referral_code, status, partner_slug }) => {
      try {
        const body: Record<string, unknown> = {};
        if (new_email !== undefined) body.email = new_email;
        if (referral_code !== undefined) body.referral_code = referral_code;
        if (status !== undefined) body.status = status;
        if (partner_slug !== undefined) body.partner_slug = partner_slug;

        const encoded = encodeURIComponent(email);
        const data = await apiRequest(
          config,
          "PUT",
          `/affiliates/${encoded}`,
          body
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 5. delete_affiliate
  // -----------------------------------------------------------------------
  server.tool(
    "delete_affiliate",
    "Delete an affiliate from your project. This also removes their associated referral data.",
    {
      email: z
        .string()
        .email()
        .describe("Email of the affiliate to delete"),
    },
    async ({ email }) => {
      try {
        const encoded = encodeURIComponent(email);
        const data = await apiRequest(
          config,
          "DELETE",
          `/affiliates/${encoded}`
        );
        return textResult({ success: true, message: `Affiliate ${email} deleted.` });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 6. list_referrals
  // -----------------------------------------------------------------------
  server.tool(
    "list_referrals",
    "List referred users (signups tracked through affiliate links). Filter by affiliate or conversion status. Shows which affiliate referred each user.",
    {
      affiliate_id: z
        .number()
        .int()
        .optional()
        .describe("Filter by affiliate ID"),
      status: z
        .enum(["pending", "converted", "direct", "direct_signup"])
        .optional()
        .describe("Filter by conversion status"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Number of results (default 20)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Pagination offset"),
    },
    async ({ affiliate_id, status, limit, offset }) => {
      try {
        const data = await apiRequest(config, "GET", "/referrals", undefined, {
          affiliate_id,
          status,
          limit,
          offset,
        });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 7. get_referral_details
  // -----------------------------------------------------------------------
  server.tool(
    "get_referral_details",
    "Get details for a specific referred user by their email address.",
    {
      email: z
        .string()
        .email()
        .describe("Email of the referred user"),
    },
    async ({ email }) => {
      try {
        const encoded = encodeURIComponent(email);
        const data = await apiRequest(
          config,
          "GET",
          `/referrals/${encoded}`
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 8. create_referral
  // -----------------------------------------------------------------------
  server.tool(
    "create_referral",
    "Manually create a referred user record, optionally linking them to a specific affiliate.",
    {
      email: z
        .string()
        .email()
        .describe("Email of the referred user"),
      affiliate_id: z
        .number()
        .int()
        .optional()
        .describe("ID of the referring affiliate"),
      status: z
        .enum(["pending", "converted", "direct", "direct_signup"])
        .optional()
        .describe("Conversion status (default: pending)"),
    },
    async ({ email, affiliate_id, status }) => {
      try {
        const body: Record<string, unknown> = { email };
        if (affiliate_id !== undefined) body.affiliate_id = affiliate_id;
        if (status !== undefined) body.status = status;

        const data = await apiRequest(config, "POST", "/referrals", body);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 9. list_conversions
  // -----------------------------------------------------------------------
  server.tool(
    "list_conversions",
    "List conversions (signups and purchases) tracked in your affiliate program. Filter by type, affiliate, date range, or paid status.",
    {
      type: z
        .enum(["signup", "purchase"])
        .optional()
        .describe("Filter by conversion type"),
      affiliate_id: z
        .number()
        .int()
        .optional()
        .describe("Filter by affiliate ID"),
      paid: z
        .boolean()
        .optional()
        .describe("Filter by paid status (true = paid out, false = pending)"),
      from: z
        .string()
        .optional()
        .describe("Start date filter (ISO 8601, e.g. 2025-01-01)"),
      to: z
        .string()
        .optional()
        .describe("End date filter (ISO 8601, e.g. 2025-12-31)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Number of results (default 50)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Pagination offset"),
    },
    async ({ type, affiliate_id, paid, from, to, limit, offset }) => {
      try {
        const query: Record<string, string | number | boolean | undefined> = {
          type,
          affiliate_id,
          from,
          to,
          limit,
          offset,
        };
        if (paid !== undefined) query.paid = String(paid);
        const data = await apiRequest(
          config,
          "GET",
          "/conversions",
          undefined,
          query
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 10. get_conversion
  // -----------------------------------------------------------------------
  server.tool(
    "get_conversion",
    "Get details for a specific conversion by its ID.",
    {
      id: z.number().int().describe("Conversion ID"),
    },
    async ({ id }) => {
      try {
        const data = await apiRequest(config, "GET", `/conversions/${id}`);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 11. create_conversion
  // -----------------------------------------------------------------------
  server.tool(
    "create_conversion",
    "Manually create a conversion (signup or purchase). For purchases, the commission is auto-calculated from project settings if value is not provided. You can identify the affiliate by ID or referral code.",
    {
      type: z
        .enum(["signup", "purchase"])
        .describe("Conversion type: signup or purchase"),
      value: z
        .number()
        .optional()
        .describe(
          "Commission value (auto-calculated from project settings if omitted)"
        ),
      base_value: z
        .number()
        .optional()
        .describe("Original transaction amount before commission"),
      affiliate_id: z
        .number()
        .int()
        .optional()
        .describe("ID of the referring affiliate"),
      referral_code: z
        .string()
        .optional()
        .describe(
          "Referral code to look up the affiliate (used if affiliate_id is not provided)"
        ),
      referred_user_id: z
        .number()
        .int()
        .optional()
        .describe("ID of the referred user"),
      email: z
        .string()
        .email()
        .optional()
        .describe("Email of the customer (for webhook payloads)"),
      paid: z
        .boolean()
        .optional()
        .describe("Whether the commission has been paid out (default false)"),
      reference: z
        .string()
        .optional()
        .describe("External reference ID (e.g. invoice number)"),
      coupon_code_used: z
        .string()
        .optional()
        .describe("Coupon code used in this conversion"),
      base_value_currency: z
        .string()
        .optional()
        .describe("Currency of the base value (e.g. USD, EUR)"),
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { type: params.type };
        const optionalFields = [
          "value",
          "base_value",
          "affiliate_id",
          "referral_code",
          "referred_user_id",
          "email",
          "paid",
          "reference",
          "coupon_code_used",
          "base_value_currency",
        ] as const;

        for (const field of optionalFields) {
          if (params[field] !== undefined) {
            body[field] = params[field];
          }
        }

        const data = await apiRequest(config, "POST", "/conversions", body);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 12. update_conversion
  // -----------------------------------------------------------------------
  server.tool(
    "update_conversion",
    "Update a conversion's details. Commonly used to mark a conversion as paid or update its value.",
    {
      id: z.number().int().describe("Conversion ID to update"),
      value: z.number().optional().describe("New commission value"),
      base_value: z
        .number()
        .optional()
        .describe("New base transaction value"),
      type: z
        .enum(["signup", "purchase"])
        .optional()
        .describe("New conversion type"),
      paid: z
        .boolean()
        .optional()
        .describe("Mark as paid (true) or unpaid (false)"),
      reference: z.string().optional().describe("New reference ID"),
      coupon_code_used: z
        .string()
        .optional()
        .describe("New coupon code"),
      base_value_currency: z
        .string()
        .optional()
        .describe("New currency code"),
    },
    async ({ id, ...fields }) => {
      try {
        const body: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(fields)) {
          if (val !== undefined) body[key] = val;
        }
        const data = await apiRequest(
          config,
          "PUT",
          `/conversions/${id}`,
          body
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 13. delete_conversion
  // -----------------------------------------------------------------------
  server.tool(
    "delete_conversion",
    "Delete a conversion record by its ID.",
    {
      id: z.number().int().describe("Conversion ID to delete"),
    },
    async ({ id }) => {
      try {
        await apiRequest(config, "DELETE", `/conversions/${id}`);
        return textResult({ success: true, message: `Conversion ${id} deleted.` });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 14. list_coupons
  // -----------------------------------------------------------------------
  server.tool(
    "list_coupons",
    "List coupon codes associated with affiliates in your project. Filter by status, affiliate, or coupon code search.",
    {
      status: z
        .enum(["active", "inactive"])
        .optional()
        .describe("Filter by coupon status"),
      affiliate_id: z
        .number()
        .int()
        .optional()
        .describe("Filter by affiliate ID"),
      coupon_code: z
        .string()
        .optional()
        .describe("Search by coupon code (partial match)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("Number of results (default 50)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Pagination offset"),
    },
    async ({ status, affiliate_id, coupon_code, limit, offset }) => {
      try {
        const data = await apiRequest(config, "GET", "/coupons", undefined, {
          status,
          affiliate_id,
          coupon_code,
          limit,
          offset,
        });
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 15. get_coupon
  // -----------------------------------------------------------------------
  server.tool(
    "get_coupon",
    "Get details for a specific coupon by its ID.",
    {
      id: z.number().int().describe("Coupon ID"),
    },
    async ({ id }) => {
      try {
        const data = await apiRequest(config, "GET", `/coupons/${id}`);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 16. create_coupon
  // -----------------------------------------------------------------------
  server.tool(
    "create_coupon",
    "Create a new coupon code linked to an affiliate. Optionally tie it to a Stripe coupon ID or LemonSqueezy discount code for automatic attribution.",
    {
      affiliate_id: z
        .number()
        .int()
        .describe("ID of the affiliate to link this coupon to"),
      coupon_code: z
        .string()
        .min(3)
        .describe(
          "Coupon code (min 3 chars, alphanumeric with hyphens/underscores)"
        ),
      stripe_coupon_id: z
        .string()
        .optional()
        .describe("Stripe coupon ID for automatic attribution"),
      lemonsqueezy_discount_code: z
        .string()
        .optional()
        .describe("LemonSqueezy discount code"),
      status: z
        .enum(["active", "inactive"])
        .optional()
        .describe("Coupon status (default: active)"),
    },
    async ({
      affiliate_id,
      coupon_code,
      stripe_coupon_id,
      lemonsqueezy_discount_code,
      status,
    }) => {
      try {
        const body: Record<string, unknown> = { affiliate_id, coupon_code };
        if (stripe_coupon_id) body.stripe_coupon_id = stripe_coupon_id;
        if (lemonsqueezy_discount_code)
          body.lemonsqueezy_discount_code = lemonsqueezy_discount_code;
        if (status) body.status = status;

        const data = await apiRequest(config, "POST", "/coupons", body);
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 17. update_coupon
  // -----------------------------------------------------------------------
  server.tool(
    "update_coupon",
    "Update an existing coupon's code, linked affiliate, payment provider IDs, or status.",
    {
      id: z.number().int().describe("Coupon ID to update"),
      affiliate_id: z
        .number()
        .int()
        .optional()
        .describe("New affiliate ID"),
      coupon_code: z
        .string()
        .min(3)
        .optional()
        .describe("New coupon code"),
      stripe_coupon_id: z
        .string()
        .optional()
        .describe("New Stripe coupon ID"),
      lemonsqueezy_discount_code: z
        .string()
        .optional()
        .describe("New LemonSqueezy discount code"),
      status: z
        .enum(["active", "inactive"])
        .optional()
        .describe("New status"),
    },
    async ({ id, ...fields }) => {
      try {
        const body: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(fields)) {
          if (val !== undefined) body[key] = val;
        }
        const data = await apiRequest(
          config,
          "PUT",
          `/coupons/${id}`,
          body
        );
        return textResult(data);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // -----------------------------------------------------------------------
  // 18. delete_coupon
  // -----------------------------------------------------------------------
  server.tool(
    "delete_coupon",
    "Delete a coupon by its ID. If linked to a Stripe coupon, it will also be deleted from Stripe.",
    {
      id: z.number().int().describe("Coupon ID to delete"),
    },
    async ({ id }) => {
      try {
        await apiRequest(config, "DELETE", `/coupons/${id}`);
        return textResult({ success: true, message: `Coupon ${id} deleted.` });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
