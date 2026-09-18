import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import { useTranslations } from '@/i18n';
const variants = cva('button', {
  variants: {
    variant: {
      default: 'button-primary',
      outline: 'button-outline',
      destructive: 'button-danger',
      ghost: 'button-ghost',
    },
  },
  defaultVariants: { variant: 'default' },
});
type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof variants> & { isLoading?: boolean };
export default function Button({
  variant,
  className,
  isLoading,
  children,
  disabled,
  type = 'button',
  ...props
}: Props) {
  const t = useTranslations();
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || isLoading}
      className={cn(variants({ variant }), className)}
    >
      {isLoading ? t('loading') : children}
    </button>
  );
}
