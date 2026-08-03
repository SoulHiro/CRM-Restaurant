import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: any = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [adminClient()],
})
