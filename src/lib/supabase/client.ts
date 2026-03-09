/**
 * @deprecated Supabase client has been replaced by Prisma + Server Actions.
 * This stub exists only for backward compatibility during migration.
 * All new code should use Server Actions from @/app/actions/dashboard-data.ts
 */

type SupabaseQueryBuilder = {
  select: (...args: any[]) => SupabaseQueryBuilder
  insert: (...args: any[]) => SupabaseQueryBuilder
  update: (...args: any[]) => SupabaseQueryBuilder
  upsert: (...args: any[]) => SupabaseQueryBuilder
  delete: (...args: any[]) => SupabaseQueryBuilder
  eq: (...args: any[]) => SupabaseQueryBuilder
  neq: (...args: any[]) => SupabaseQueryBuilder
  gt: (...args: any[]) => SupabaseQueryBuilder
  gte: (...args: any[]) => SupabaseQueryBuilder
  lt: (...args: any[]) => SupabaseQueryBuilder
  lte: (...args: any[]) => SupabaseQueryBuilder
  or: (...args: any[]) => SupabaseQueryBuilder
  ilike: (...args: any[]) => SupabaseQueryBuilder
  in: (...args: any[]) => SupabaseQueryBuilder
  is: (...args: any[]) => SupabaseQueryBuilder
  single: () => Promise<{ data: Record<string, any> | null; error: any }>
  maybeSingle: () => Promise<{ data: Record<string, any> | null; error: any }>
  order: (...args: any[]) => SupabaseQueryBuilder
  limit: (...args: any[]) => SupabaseQueryBuilder
  count: (...args: any[]) => SupabaseQueryBuilder
  then: (resolve: (value: { data: any[]; error: null; count?: number }) => void) => Promise<void>
}

function createQueryBuilder(): SupabaseQueryBuilder {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    or: () => builder,
    ilike: () => builder,
    single: async () => ({ data: null as Record<string, any> | null, error: { message: 'Supabase has been replaced by Prisma. Use Server Actions.' } }),
    maybeSingle: async () => ({ data: null as Record<string, any> | null, error: null }),
    order: () => builder,
    limit: () => builder,
    count: () => builder,
    in: () => builder,
    is: () => builder,
    then: async (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  }
  return builder
}

export function createClient() {
  return {
    from: (_table: string) => createQueryBuilder(),
    auth: {
      getUser: async () => ({ data: { user: null as Record<string, any> | null }, error: null }),
      signInWithPassword: async (_args: any) => ({ data: { user: null as Record<string, any> | null, session: null }, error: null as { message: string } | null }),
      signUp: async (_args: any) => ({ data: { user: null as Record<string, any> | null, session: null }, error: null as { message: string } | null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (_event: string, _callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: (_name: string) => ({
      on: () => ({ subscribe: () => {} }),
    }),
  }
}
