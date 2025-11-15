import { auth } from '@/lib/auth'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

// Get current user
export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
    async () => {
    const headers = getRequestHeaders();
      const session = await auth.api.getSession(({
        headers,
      }))

      return session?.user
    },
  )