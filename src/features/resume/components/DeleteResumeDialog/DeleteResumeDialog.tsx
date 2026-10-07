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
      description={`"${resumeTitle}" will move to Trash. You can restore it from your workspace.`}
      confirmLabel="Delete"
      cancelLabel="Keep"
      variant="danger"
      loading={isLoading}
    />
  )
}
