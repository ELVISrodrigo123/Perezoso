import { CAlert } from '@coreui/react'

// Alerta flotante: siempre queda por encima de los modales
const FeedbackAlert = ({ feedback, onClose }) => {
  if (!feedback) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        width: 'min(560px, calc(100% - 32px))',
      }}
    >
      <CAlert
        color={feedback.color}
        dismissible
        onClose={onClose}
        className="shadow mb-0"
        style={{ whiteSpace: 'pre-line' }}
      >
        {feedback.message}
      </CAlert>
    </div>
  )
}

export default FeedbackAlert
