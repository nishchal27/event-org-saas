'use client'

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { trpc, trpcClient } from '@/lib/trpc-client'
import {
  getTrpcAuthErrorHandler,
  setTrpcAuthErrorHandler,
  isTrpcAuthError,
} from '@/lib/trpc-auth-error'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/toaster'

function onTrpcError(error: unknown) {
  if (isTrpcAuthError(error)) {
    getTrpcAuthErrorHandler()(error as any)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: onTrpcError,
        }),
        mutationCache: new MutationCache({
          onError: onTrpcError,
        }),
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            cacheTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
            refetchOnMount: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  useEffect(() => {
    setTrpcAuthErrorHandler((error) => {
      const code = error.data?.code
      if (code === 'UNAUTHORIZED') {
        // Often "no organization" (signed in but orgId undefined) — redirect to create/select org.
        // If user is not signed in, dashboard layout will redirect from there to /sign-in.
        toast({
          title: 'Organization required',
          description: 'Create or select an organization to continue.',
          variant: 'destructive',
        })
        window.location.href = '/create-organization'
      } else if (code === 'FORBIDDEN') {
        toast({
          title: 'Access denied',
          description: "You don't have permission to do this.",
          variant: 'destructive',
        })
      }
    })
  }, [toast])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
