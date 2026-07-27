const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  if (!backendUrl) {
    throw new Error('Falta configurar NEXT_PUBLIC_BACKEND_URL para el panel administrativo.')
  }

  const response = await fetch(`${backendUrl}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })

  if (response.status === 204) return null

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.error?.message ?? 'No fue posible completar la solicitud.')
  }
  return body
}
