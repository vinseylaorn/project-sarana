import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles — shared by ALL variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[12px] font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 aria-invalid:border-destructive select-none",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30',
        outline:
          'border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white shadow-sm',
        secondary:
          'bg-gray-100 dark:bg-white/[0.07] text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.12]',
        ghost:
          'text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-gray-900 dark:hover:text-white',
        link:
          'text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline p-0 h-auto',

        // Primary action (Add, Save, Confirm)
        primary:
          'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-600/20 focus-visible:ring-indigo-500/40 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 dark:border dark:border-indigo-500/30 dark:shadow-none',

        // Success / Confirm to kitchen / Payment
        success:
          'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/20 focus-visible:ring-emerald-500/40 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-300 dark:border dark:border-emerald-500/28 dark:shadow-none',

        // Danger / Delete / Cancel reservation
        danger:
          'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-600/15 focus-visible:ring-rose-500/40 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-300 dark:border dark:border-rose-500/28 dark:shadow-none',

        // Warning / Reserved / Pending
        warning:
          'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-md shadow-amber-500/20 focus-visible:ring-amber-500/40 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-300 dark:border dark:border-amber-500/28 dark:shadow-none',

        // Soft Indigo — ghost-like but with subtle bg (tabs, filters)
        'soft-primary':
          'bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',

        // Soft Emerald
        'soft-success':
          'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',

        // Soft Rose
        'soft-danger':
          'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',

        // Soft Amber
        'soft-warning':
          'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',

        // App Order — indigo outlined (POS top bar)
        'app-order':
          'bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20',

        // Takeaway — rose outlined (POS top bar)
        'takeaway':
          'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20',

        // Reserved — amber outlined (POS top bar)
        'reserved':
          'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20',
      },

      size: {
        // shadcn defaults
        default:   'h-9 px-4 py-2 has-[>svg]:px-3',
        sm:        'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg:        'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon:      'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',

        // App sizes
        xs:        'h-7 px-3 text-[11px] rounded-md gap-1',
        md:        'h-10 px-5 text-[13px]',
        xl:        'h-12 px-8 text-[14px] rounded-xl',
        'icon-xs': 'size-7 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }