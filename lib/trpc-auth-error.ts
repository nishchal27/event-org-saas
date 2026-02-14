import type { TRPCClientErrorLike } from '@trpc/client'

export type TrpcAuthErrorHandler = (error: TRPCClientErrorLike<any>) => void

let handler: TrpcAuthErrorHandler = () => {}

export function setTrpcAuthErrorHandler(fn: TrpcAuthErrorHandler) {
  handler = fn
}

export function getTrpcAuthErrorHandler(): TrpcAuthErrorHandler {
  return handler
}

export function isTrpcAuthError(error: unknown): boolean {
  const err = error as { data?: { code?: string } }
  return err?.data?.code === 'UNAUTHORIZED' || err?.data?.code === 'FORBIDDEN'
}
