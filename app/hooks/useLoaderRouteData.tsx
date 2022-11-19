import type { LoaderFunction, SerializeFrom } from '@remix-run/node'

import { useMatches } from '@remix-run/react'

export function useLoaderRouteData<
  Loader extends LoaderFunction,
  Return = SerializeFrom<Loader>
>(route: 'root' | `routes/${string}`) {
  const matches = useMatches()
  return matches.find((match) => match.id === route)?.data as Return | undefined
}
