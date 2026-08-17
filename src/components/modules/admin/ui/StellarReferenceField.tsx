'use client';

import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StellarReferenceModal } from './StellarReferenceModal';

interface StellarReferenceFieldProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Article content field with a "Insert Stellar Reference" toolbar button.
 * Client Component: controls the textarea so the modal can insert a
 * `[[stellar:…]]` tag at the caret. The underlying textarea keeps its `name`
 * so the existing server action reads `content` from FormData unchanged.
 */
export function StellarReferenceField({
  name,
  defaultValue = '',
  required,
  placeholder,
  className,
}: StellarReferenceFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;

    // Pad with spaces so the tag sits on its own and renders as a block embed.
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lead = before && !before.endsWith('\n') && !before.endsWith(' ') ? ' ' : '';
    const trail = after && !after.startsWith('\n') && !after.startsWith(' ') ? ' ' : '';
    const next = `${before}${lead}${tag}${trail}${after}`;

    setValue(next);

    // Restore focus + place the caret just after the inserted tag.
    requestAnimationFrame(() => {
      if (!el) return;
      const caret = before.length + lead.length + tag.length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Stellar ids and <code className="font-mono">[[stellar:…]]</code> tags render as embeds.
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Sparkles />
          Insert Stellar Reference
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        name={name}
        required={required}
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <StellarReferenceModal open={open} onClose={() => setOpen(false)} onInsert={insertTag} />
    </div>
  );
}
