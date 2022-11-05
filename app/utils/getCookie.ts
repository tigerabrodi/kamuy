import type { DataFunctionArgs } from '@remix-run/node'

export function getCookie(request: DataFunctionArgs['request']) {
  return request.headers.get('Cookie')
}
