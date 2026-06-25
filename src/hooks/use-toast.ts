import * as React from "react"

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(({ title, description, variant }: ToastProps) => {
    setToasts((prev) => [...prev, { title, description, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 5000)
  }, [])

  return { toast, toasts }
}

export { useToast }
