import { Fragment, type ReactNode } from 'react';

import { LEGAL_ENTITY } from '../legal-entity';

function withEmailLinks(text: string): ReactNode {
  const parts = text.split(LEGAL_ENTITY.email);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <a
          href={`mailto:${LEGAL_ENTITY.email}`}
          className="text-clay underline underline-offset-2 hover:text-ink"
        >
          {LEGAL_ENTITY.email}
        </a>
      )}
    </Fragment>
  ));
}

/** Renders locale text where blank lines split paragraphs and `- ` lines form a list. */
export function LegalText({ text }: { text: string }) {
  const blocks = text.split('\n\n');

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
              {lines.map((line, j) => (
                <li key={j}>{withEmailLinks(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{withEmailLinks(block)}</p>;
      })}
    </div>
  );
}
