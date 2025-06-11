interface ToastProps {
  title: string
  description?: string
}

export function toast({ title, description }: ToastProps) {
  // For now, just console.log the toast message
  console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`)
} 