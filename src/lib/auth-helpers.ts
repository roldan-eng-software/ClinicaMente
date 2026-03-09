'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Helper: Retorna o psicólogo autenticado a partir da sessão NextAuth.
 * Lança erro se não autenticado ou se o perfil não existe.
 */
export async function getAuthenticatedPsychologist() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado', psychologist: null, userId: null }
  }

  const psychologist = await prisma.psychologist.findUnique({
    where: { userId: session.user.id },
  })

  return { error: null, psychologist, userId: session.user.id }
}
