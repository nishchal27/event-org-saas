import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/server/routers/_app'
import { createContext } from '@/lib/trpc'
import { NextRequest, NextResponse } from 'next/server'

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
          console.error('Error creating context:', error)
          throw error
        }
      },
      onError: ({ error, path, type, ctx }) => {
        console.error(`❌ tRPC Error on '${path}' (${type}):`, error)
        if (error.code === 'INTERNAL_SERVER_ERROR') {
          console.error('Error details:', error.cause)
          console.error('Error message:', error.message)
          if (error.cause instanceof Error) {
            console.error('Cause stack:', error.cause.stack)
            console.error('Cause message:', error.cause.message)
          }
        }
      },
    })
    return response
  } catch (error) {
    console.error('❌ Unhandled error in tRPC handler:', error)
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
