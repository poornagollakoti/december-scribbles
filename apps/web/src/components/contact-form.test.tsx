import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from './contact-form';

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Your name'), 'Ada');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.selectOptions(screen.getByLabelText('What is it about?'), 'COLLABORATION');
  await user.type(screen.getByLabelText(/^Message/), 'I would love to collaborate on a zine.');
  return user;
}

describe('ContactForm', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows accessible validation errors and does not submit invalid input', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Please tell us your name')).toBeInTheDocument();
    expect(screen.getByText('Please enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument();
    const name = screen.getByLabelText('Your name');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Please tell us your name');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits the enquiry to the API and confirms success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { id: 'e1', receivedAt: '2026-01-01T00:00:00Z' }),
    );
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(/Thank/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/enquiries');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      type: 'COLLABORATION',
      message: 'I would love to collaborate on a zine.',
    });
  });

  it('maps server-side field errors onto the form', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        message: 'Validation failed',
        details: [{ field: 'email', message: 'Please enter a valid email address' }],
      }),
    );
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
  });

  it('shows a friendly message when rate limited', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }),
    );
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });

  it('handles network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<ContactForm />);
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not reach the server');
  });
});
