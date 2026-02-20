import { createClient as createBrowserClient } from './client'
import { createClient as createServerClientFromModule } from './server'

export const createClient = createBrowserClient
export const createServerClient = createServerClientFromModule
