'use client'

import { useEffect, useState, useCallback } from 'react'
import { messaging, getToken } from '@/lib/firebase'
import { createClient } from '@/lib/supabase/client'

export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')

  const requestAndSave = useCallback(async () => {
    // Check browser support
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermissionStatus('unsupported')
      return null
    }

    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)

      if (permission !== 'granted' || !messaging) {
        return null
      }

      // Register service worker with Firebase config injected
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      })

      if (fcmToken) {
        setToken(fcmToken)

        // Save to profiles table
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await supabase
            .from('profiles')
            .update({ fcm_token: fcmToken })
            .eq('id', session.user.id)
        }
      }

      return fcmToken
    } catch (err) {
      console.error('FCM token error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    requestAndSave()
  }, [requestAndSave])

  return { token, permissionStatus, requestAndSave }
}
