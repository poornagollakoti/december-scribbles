'use client';

import type { LoginRequest, SessionUser } from '@ds/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { FormField } from '../form-field';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Enter your password'),
});

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginRequest) => {
    setError(null);
    try {
      await apiRequest<SessionUser>('/auth/login', { method: 'POST', json: values });
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(userMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <FormField label="Email" error={errors.email?.message}>
        <input
          className="field-input"
          type="email"
          autoComplete="username"
          {...register('email')}
        />
      </FormField>
      <FormField label="Password" error={errors.password?.message}>
        <input
          className="field-input"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
      </FormField>
      <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
