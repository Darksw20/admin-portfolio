const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  if (!backendUrl) {
    throw new Error('Falta configurar NEXT_PUBLIC_BACKEND_URL para el panel administrativo.')
  }

  const response = await fetch(`${backendUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })

  if (response.status === 204) return null

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.error?.message ?? 'No fue posible completar la solicitud.')
    error.status = response.status
    error.code = body?.error?.code
    throw error
  }
  return body
}
