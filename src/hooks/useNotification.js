import { useState, useCallback } from 'react'

export const useNotification = () => {
  const [notification, setNotification] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const showNotification = useCallback((type, message, duration = 5000) => {
    setNotification({ type, message, duration })
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(null)
  }, [])

  const showConfirm = useCallback((title, message, onConfirm, variant = 'danger') => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        variant,
        onConfirm: async () => {
          setConfirmModal(null)
          const result = await onConfirm()
          resolve(true)
          return result
        },
        onCancel: () => {
          setConfirmModal(null)
          resolve(false)
        }
      })
    })
  }, [])

  return {
    notification,
    confirmModal,
    showNotification,
    hideNotification,
    showConfirm
  }
}
