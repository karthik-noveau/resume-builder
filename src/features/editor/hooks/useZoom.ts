import { useEditorStore } from '@/shared/stores/editor.store'

export function useZoom() {
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const zoomIn = useEditorStore((s) => s.zoomIn)
  const zoomOut = useEditorStore((s) => s.zoomOut)
  const resetZoom = useEditorStore((s) => s.resetZoom)
  const setZoom = useEditorStore((s) => s.setZoom)

  return { zoomLevel, zoomIn, zoomOut, resetZoom, setZoom }
}
