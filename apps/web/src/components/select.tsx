import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import { Icon } from './icon';

/**
 * Native <select> (keeps platform accessibility and mobile pickers) styled to match the
 * design system, with a Lucide chevron. Accepts id/aria props from <FormField>.
 */
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} className={clsx('field-input', className)} {...props}>
          {children}
        </select>
        <Icon
          icon={ChevronDown}
          size="sm"
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-2"
        />
      </div>
    );
  },
);
