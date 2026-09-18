import { Controller, type Control } from 'react-hook-form';
import { useTranslations } from '@/i18n';
import type { Option } from '@/types';
export interface InputProps {
  control: Control<any>;
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: Option[];
  multiple?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
}
export default function Input({
  control,
  name,
  label,
  type = 'text',
  required,
  options,
  multiple,
  disabled,
  min,
  max,
}: InputProps) {
  const t = useTranslations();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className='field'>
          <label htmlFor={name}>
            {label || t(name)}
            {required && <span aria-hidden='true'> *</span>}
          </label>
          {options ? (
            <select
              {...field}
              id={name}
              aria-label={label || t(name)}
              aria-required={required}
              disabled={disabled}
              multiple={multiple}
              value={field.value ?? (multiple ? [] : '')}
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? name + '-error' : undefined}
              onChange={(e) =>
                field.onChange(
                  multiple
                    ? Array.from(e.target.selectedOptions, (o) => o.value)
                    : e.target.value,
                )
              }
            >
              {!multiple && <option value=''>{t('choose')}</option>}
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              {...field}
              id={name}
              aria-label={label || t(name)}
              aria-required={required}
              value={field.value ?? ''}
              rows={4}
            />
          ) : (
            <input
              {...field}
              id={name}
              aria-label={label || t(name)}
              aria-required={required}
              type={type}
              value={type === 'checkbox' ? undefined : (field.value ?? '')}
              checked={type === 'checkbox' ? !!field.value : undefined}
              onChange={(e) =>
                field.onChange(
                  type === 'checkbox' ? e.target.checked : e.target.value,
                )
              }
              min={min}
              max={max}
              disabled={disabled}
              aria-invalid={!!fieldState.error}
              aria-describedby={fieldState.error ? name + '-error' : undefined}
              autoComplete={type === 'password' ? 'new-password' : undefined}
            />
          )}{' '}
          {fieldState.error && (
            <small id={name + '-error'} role='alert' className='error'>
              {t('invalid')}
            </small>
          )}
        </div>
      )}
    />
  );
}
