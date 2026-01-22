'use client'

import { useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
  durationSeconds: number
}

const typeStyles = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
}

const typeIcons = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/state')
        const data = await res.json()
        if (data.notifications && data.notifications.length > 0) {
          // Only add notifications we haven't seen
          const newNotifications = data.notifications.filter(
            (n: Notification) => !seenIds.has(n.id)
          )

          if (newNotifications.length > 0) {
            setNotifications(prev => [...prev, ...newNotifications])
            setSeenIds(prev => {
              const newSet = new Set(prev)
              newNotifications.forEach((n: Notification) => newSet.add(n.id))
              return newSet
            })

            // Auto-dismiss each notification after its duration
            newNotifications.forEach((n: Notification) => {
              setTimeout(() => {
                dismissNotification(n.id)
              }, (n.durationSeconds || 5) * 1000)
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 1000) // Poll every second for notifications
    return () => clearInterval(interval)
  }, [seenIds, dismissNotification])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${typeStyles[notification.type]} text-white p-4 rounded-lg shadow-lg flex items-start gap-3 animate-slide-in`}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <span className="text-xl">{typeIcons[notification.type]}</span>
          <p className="flex-1 text-sm font-medium">{notification.message}</p>
          <button
            onClick={() => dismissNotification(notification.id)}
            className="text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
