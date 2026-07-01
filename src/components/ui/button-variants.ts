import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full bg-clip-padding font-medium text-sm outline-none transition-[transform,box-shadow,background-color,color] duration-150 ease-[var(--ease-out)] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0 dark:aria-invalid:ring-destructive/40 [&_span]:relative [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:relative [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-0 bg-primary text-primary-foreground shadow-[0_1px_0_oklch(1_0_0/0.42)_inset,0_10px_24px_oklch(0.55_0.12_86/0.2)] hover:bg-primary/96 hover:shadow-[0_1px_0_oklch(1_0_0/0.58)_inset,0_14px_30px_oklch(0.55_0.12_86/0.28)]",
        outline:
          "border border-border/80 bg-card/60 text-foreground shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] transition-[transform,box-shadow,border-color,background-color,color] hover:border-selected-border hover:bg-selected-hover/70 aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
