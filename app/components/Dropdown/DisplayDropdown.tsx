import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CgChevronDown } from 'react-icons/cg';
export default function DisplayDropdown({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    };
    place();
    const close = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);
  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        className='display-dropdown-trigger flex items-center gap-2'
        aria-expanded={open}
        aria-haspopup='true'
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <CgChevronDown />
      </button>
      {open &&
        createPortal(
          <ul
            ref={listRef}
            className='display-dropdown-list'
            style={{ top: position.top, left: position.left }}
          >
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
