import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog'

interface DeleteResumeDialogProps {
  isOpen: boolean
  resumeTitle: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteResumeDialog({
  isOpen,
  resumeTitle,
  onClose,
  onConfirm,
  isLoading,
}: DeleteResumeDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Resume"
      description={`"${resumeTitle}" will be permanently deleted. This cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Keep"
      variant="danger"
      loading={isLoading}
    />
  )
}
