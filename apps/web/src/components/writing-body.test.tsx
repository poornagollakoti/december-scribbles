import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WritingBody } from './writing-body';

describe('WritingBody', () => {
  it('splits stanzas on blank lines and keeps single line breaks', () => {
    const { container } = render(
      <WritingBody kind="POEM" body={'line one\nline two\n\nsecond stanza'} />,
    );
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toBe('line one\nline two');
    expect(paragraphs[0]).toHaveClass('whitespace-pre-line');
  });

  it('renders HTML in the text as plain text, never as markup', () => {
    const { container } = render(
      <WritingBody kind="PROSE" body={'<img src=x onerror="alert(1)"><b>bold</b>'} />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });

  it('renders quotes as a blockquote', () => {
    render(<WritingBody kind="QUOTE" body="Be kind." />);
    expect(screen.getByText(/Be kind./).closest('blockquote')).not.toBeNull();
  });
});
