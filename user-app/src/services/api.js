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

import { routes as mockRoutes, buses as mockBuses, myBookings as defaultBookings } from '../data/mockData'

function getStoredBookings() {
    try {
        const stored = localStorage.getItem('bmtc_bookings')
        return stored ? JSON.parse(stored) : defaultBookings
    } catch {
        return defaultBookings
    }
}

function saveStoredBookings(bookings) {
    try {
        localStorage.setItem('bmtc_bookings', JSON.stringify(bookings))
    } catch (e) {
        console.warn('Could not save bookings to localStorage', e)
    }
}

export async function getRoutes() {
    try {
        return await apiFetch(`${BASE}/routes`)
    } catch {
        return mockRoutes
    }
}

export async function getBuses() {
    try {
        return await apiFetch(`${BASE}/buses`)
    } catch {
        return mockBuses
    }
}

export async function getBookings(userEmail) {
    try {
        const url = userEmail
            ? `${BASE}/bookings?user=${encodeURIComponent(userEmail)}`
            : `${BASE}/bookings`
        return await apiFetch(url)
    } catch {
        const all = getStoredBookings()
        return userEmail ? all.filter(b => !b.user || b.user === userEmail) : all
    }
}

export async function createBooking(booking) {
    try {
        return await apiFetch(`${BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        })
    } catch {
        const all = getStoredBookings()
        const newBooking = { ...booking, id: `BK${Date.now().toString().slice(-4)}` }
        saveStoredBookings([newBooking, ...all])
        return newBooking
    }
}

export async function cancelBooking(id) {
    try {
        return await apiFetch(`${BASE}/bookings/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Cancelled' })
        })
    } catch {
        const all = getStoredBookings()
        const updated = all.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b)
        saveStoredBookings(updated)
        return updated.find(b => b.id === id)
    }
}
