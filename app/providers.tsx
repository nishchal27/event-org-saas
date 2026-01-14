'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/lib/trpc-client'
import { Toaster } from '@/components/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 30 seconds (no refetch needed)
            staleTime: 30 * 1000,
            // Cache data for 5 minutes (v4 uses cacheTime)
            cacheTime: 5 * 60 * 1000,
            // Don't refetch on window focus (better UX, less network)
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect (data is still fresh)
            refetchOnReconnect: false,
            // Retry failed requests once
            retry: 1,
            // Show cached data immediately while refetching
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  )
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          // Batch requests within 10ms window
          maxBatchSize: 10,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
