// Shared API service — reads from VITE_API_URL or defaults to local dev server
export const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:6001').replace(/\/$/, '')

// Helper: wraps fetch with a human-readable connection error
async function apiFetch(url, options = {}) {
    try {
        const res = await fetch(url, options)
        if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
        }
        if (res.status === 204) return null   // DELETE returns 204 No Content
        return res.json()
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('fetch')) {
            throw new Error(`Cannot reach API server at ${BASE}. Please verify the backend is running.`)
        }
        throw err
    }
}

export async function getRoutes() {
    return apiFetch(`${BASE}/routes`)
}

export async function getBuses() {
    return apiFetch(`${BASE}/buses`)
}

export async function getBookings(userEmail) {
    const url = userEmail
        ? `${BASE}/bookings?user=${encodeURIComponent(userEmail)}`
        : `${BASE}/bookings`
    return apiFetch(url)
}

export async function createBooking(booking) {
    return apiFetch(`${BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
    })
}

export async function cancelBooking(id) {
    return apiFetch(`${BASE}/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
    })
}
