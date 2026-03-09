/**
 * @deprecated Supabase server has been replaced by Prisma + NextAuth.
 * This stub exists only for backward compatibility during migration.
 * All new code should use prisma from @/lib/prisma and auth from @/lib/auth
 */

export async function createClient() {
  const queryBuilder: any = {
    select: () => queryBuilder,
    insert: () => queryBuilder,
    update: () => queryBuilder,
    upsert: () => queryBuilder,
    delete: () => queryBuilder,
    eq: () => queryBuilder,
    neq: () => queryBuilder,
    gt: () => queryBuilder,
    gte: () => queryBuilder,
    lt: () => queryBuilder,
    lte: () => queryBuilder,
    or: () => queryBuilder,
    ilike: () => queryBuilder,
    count: () => queryBuilder,
    single: async () => ({ data: null as Record<string, any> | null, error: { message: 'Supabase has been replaced by Prisma.' } }),
    maybeSingle: async () => ({ data: null as Record<string, any> | null, error: null }),
    order: () => queryBuilder,
    limit: () => queryBuilder,
    in: () => queryBuilder,
    is: () => queryBuilder,
    then: async (resolve: any) => resolve({ data: [], error: null, count: 0 }),
  }

  return {
    from: (_table: string) => queryBuilder,
    auth: {
      getUser: async () => ({ data: { user: null as Record<string, any> | null }, error: null }),
    },
  }
}
