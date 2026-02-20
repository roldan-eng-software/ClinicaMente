import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, getRateLimitConfig, getClientKey } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  const rateLimitConfig = getRateLimitConfig(pathname)
  if (rateLimitConfig) {
    const clientKey = getClientKey(request)
    const rateLimitKey = `${clientKey}:${pathname}`
    const result = rateLimit(rateLimitKey, rateLimitConfig.limit, rateLimitConfig.windowMs)

    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(rateLimitConfig.limit),
          'X-RateLimit-Remaining': '0',
        },
      })
    }

    response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/onboarding']
  const publicPsychologistRoutes = pathname.startsWith('/p/')
  const isPublicRoute = publicRoutes.includes(pathname) || publicPsychologistRoutes
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isApiRoute = pathname.startsWith('/api/')

  if (!user && !isPublicRoute && !isApiRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isApiRoute) {
    const cronRoutes = pathname.startsWith('/api/cron/')
    const webhookRoutes = pathname.startsWith('/api/webhooks/')
    const verifySubscriptionRoute = pathname === '/api/verify-subscription'
    
    if (cronRoutes || webhookRoutes || verifySubscriptionRoute) {
      return response
    }
    
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
