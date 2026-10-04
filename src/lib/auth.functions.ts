import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const env = typeof process !== "undefined" ? process.env : {};

const supabaseUrl =
  env["VITE_SUPABASE_URL"] ||
  env["SUPABASE_URL"] ||
  "https://pofzbshdejpdoalizbjx.supabase.co";

const supabaseServiceRoleKey =
  env["SUPABASE_SERVICE_ROLE_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZnpic2hkZWpwZG9hbGl6Ymp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTExMDk5NiwiZXhwIjoyMTA2Njg2OTk2fQ.TjxhAxwl6t5lAEVE6Vu8hKltFx5f9AENuCNgPVAz7HA";

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Server function to auto-confirm and establish an immediate session for any email.
 * This guarantees the user is never stuck in "Email not confirmed" state.
 */
export const instantAuthFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    return z
      .object({
        email: z.string().email(),
        password: z.string().optional(),
        fullName: z.string().optional(),
      })
      .parse(d);
  })
  .handler(async ({ data: { email, password, fullName } }) => {
    const admin = getAdminClient();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Find or create user
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      throw new Error(listError.message);
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      // Auto-confirm existing user and update attributes if provided
      const updatePayload: Record<string, unknown> = {
        email_confirm: true,
      };
      if (password) updatePayload["password"] = password;
      if (fullName) {
        updatePayload["user_metadata"] = {
          ...(existingUser["user_metadata"] as Record<string, unknown> || {}),
          full_name: fullName,
        };
      }
      await admin.auth.admin.updateUserById(existingUser.id, updatePayload);
    } else {
      // Create user pre-confirmed
      const { error: createError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: password || Math.random().toString(36).slice(-10),
        email_confirm: true,
        user_metadata: {
          full_name: fullName || "",
        },
      });
      if (createError) {
        throw new Error(createError.message);
      }
    }

    // 2. Generate a one-time OTP for immediate client verification
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      throw new Error(linkError?.message || "Failed to generate instant authentication token");
    }

    return {
      success: true,
      email: cleanEmail,
      otp: linkData.properties.email_otp,
    };
  });
