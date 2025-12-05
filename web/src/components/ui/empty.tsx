import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const emptyMediaVariants = cva(
  'flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/50 text-muted-foreground [&>svg]:size-6',
  {
    variants: {
      variant: {
        default: 'size-14',
        icon: 'size-12 rounded-full border-primary/20 bg-primary/10 text-primary [&>svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Empty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/60 bg-card/50 px-6 py-10 text-center',
        className,
      )}
      {...props}
    />
  ),
)
Empty.displayName = 'Empty'

const EmptyHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center gap-3 text-center', className)} {...props} />
  ),
)
EmptyHeader.displayName = 'EmptyHeader'

const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
  ),
)
EmptyTitle.displayName = 'EmptyTitle'

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
EmptyDescription.displayName = 'EmptyDescription'

const EmptyContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center gap-2 text-center', className)} {...props} />
  ),
)
EmptyContent.displayName = 'EmptyContent'

const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof emptyMediaVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(emptyMediaVariants({ variant }), className)} {...props} />
))
EmptyMedia.displayName = 'EmptyMedia'

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle }
