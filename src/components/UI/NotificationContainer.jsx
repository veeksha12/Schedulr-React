import React from 'react'
import Notification from './Notification'
import ConfirmModal from './ConfirmModal'

const NotificationContainer = ({ notification, confirmModal, onNotificationClose }) => {
  return (
    <>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={onNotificationClose}
          duration={notification.duration}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
          variant={confirmModal.variant || 'danger'}
        />
      )}
    </>
  )
}

export default NotificationContainer
