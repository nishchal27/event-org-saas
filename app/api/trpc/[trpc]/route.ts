import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/routers/_app'
import { createContext } from '@/lib/trpc'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const handler = async (req: NextRequest) => {
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: async () => {
        try {
          return await createContext({ req })
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error))
          logger.error('Error creating tRPC context', errorObj, {
            feature: 'trpc',
          })
          throw error
        }
      },
      onError: ({ error, path, type, ctx }) => {
        const errorObj = error.cause instanceof Error ? error.cause : error instanceof Error ? error : new Error(String(error))
        
        logger.error(`tRPC Error on '${path}' (${type})`, errorObj, {
          feature: 'trpc',
          path,
          type,
          code: error.code,
          userId: ctx?.userId ?? undefined,
          organizationId: ctx?.orgId ?? undefined,
        })
      },
    })
    return response
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    logger.error('Unhandled error in tRPC handler', errorObj, {
      feature: 'trpc',
    })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export { handler as GET, handler as POST }
