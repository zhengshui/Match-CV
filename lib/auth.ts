import { db } from "@/db/drizzle";
import { account, session, subscription, user, verification } from "@/db/schema";
// Remove polar imports for V1
// import {
//   checkout,
//   polar,
//   portal,
//   usage,
//   webhooks,
// } from "@polar-sh/better-auth";
// import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

// Simplified auth configuration for V1 - removed polar/subscription functionality

export const auth = betterAuth({
  trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  allowedDevOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // Cache duration in seconds
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      subscription,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    // Remove polar plugin for V1 - focus on email/password auth only
    // polar({
    //   client: polarClient,
    //   createCustomerOnSignUp: true,
    //   use: [
    //     checkout({...}),
    //     portal(),
    //     usage(),
    //     webhooks({...}),
    //   ],
    // }),
    nextCookies(),
  ],
});
