import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export const PAGE_SIZE = 30

/** Paged event list. Keeps the previous results on screen while a new filter loads (no flash). */
export function useEvents(params: URLSearchParams, sortByDistance: boolean) {
  return useInfiniteQuery({
    queryKey: ['events', params.toString(), sortByDistance],
    queryFn: ({ pageParam, signal }) => {
      const p = new URLSearchParams(params)
      p.set('limit', String(PAGE_SIZE))
      p.set('offset', String(pageParam))
      if (sortByDistance) p.set('sort', 'distance')
      return api.events(p, signal)
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.offset + last.items.length < last.total ? last.offset + last.limit : undefined),
    placeholderData: keepPreviousData,
  })
}

export function useCategories(params: URLSearchParams) {
  return useQuery({
    queryKey: ['categories', params.toString()],
    queryFn: ({ signal }) => api.categories(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useGeo(params: URLSearchParams) {
  return useQuery({
    queryKey: ['geo', params.toString()],
    queryFn: ({ signal }) => api.geo(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: string | null) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: ({ signal }) => api.event(id as string, signal),
    enabled: id !== null,
    // Seats change as others book: refresh while the drawer is open.
    refetchInterval: 15_000,
  })
}

export function useBook(eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => api.book(eventId, email),
    // Success or "sold out", the seat count changed: refresh the drawer and the list.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
