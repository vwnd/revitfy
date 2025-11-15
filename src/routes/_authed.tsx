import { getCurrentUserFn } from '@/server/auth';
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn();

    if (!user) {
      throw redirect({ to: '/login', search: location.search })
    }

    return { user }
  }
})

function RouteComponent() {
  return <div>Hello "/_authed"!</div>
}
