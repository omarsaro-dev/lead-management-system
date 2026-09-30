"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ title, children, onClose, busy = false, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={`modal ${wide ? "wide" : ""}`} aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <div className="modal-header"><div><span className="eyebrow">LEAD WORKSPACE</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={21} /></button></div>{children}
  </dialog>;
}
