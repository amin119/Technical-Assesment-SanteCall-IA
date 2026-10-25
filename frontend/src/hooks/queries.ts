import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export const PAGE_SIZE = 20

/**
 * One page of events. Keeps the previous page on screen while the next one loads (no flash),
 * and `isPlaceholderData` tells the UI it is still showing the old page.
 */
export function useEvents(params: URLSearchParams, page: number, sortByDistance: boolean) {
  return useQuery({
    queryKey: ['events', params.toString(), page, sortByDistance],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams(params)
      p.set('limit', String(PAGE_SIZE))
      p.set('offset', String((page - 1) * PAGE_SIZE))
      if (sortByDistance) p.set('sort', 'distance')
      return api.events(p, signal)
    },
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
