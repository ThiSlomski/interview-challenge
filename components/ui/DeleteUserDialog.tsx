'use client';
import { useLayoutEffect, useRef } from 'react';
import type { UserRecord } from './Record';

export default function DeleteUserDialog({ user, busy, dialogRef, onCancel, onConfirm, onLogout }: {
  user: UserRecord; busy: boolean; dialogRef: React.RefObject<HTMLDialogElement>;
  onCancel: () => void; onConfirm: () => void; onLogout: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    cancel.current?.focus();
    return () => dialog?.close();
  }, [dialogRef]);
  return <dialog ref={dialogRef} className="delete-dialog card" aria-labelledby="delete-user-title" aria-describedby="delete-user-description" aria-busy={busy}
    onClickCapture={event => {
      // The second click used to open this dialog can land on a newly visible
      // action at the same screen position. Require a fresh single activation.
      if (event.detail > 1) { event.preventDefault(); event.stopPropagation(); }
    }}
    onCancel={event => { event.preventDefault(); onCancel(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <h2 id="delete-user-title">Excluir usuário?</h2>
    <p id="delete-user-description">O cadastro de <strong>{user.name || 'Usuário sem nome'}</strong> ({user.email}) será removido definitivamente e todas as sessões dessa conta serão encerradas.</p>
    <p>Essa ação não pode ser desfeita.</p>
    {busy && <p role="status">Excluindo usuário e atualizando a listagem…</p>}
    <div className="actions delete-dialog-actions">
      <button ref={cancel} type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button>
      <button type="button" className="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Excluindo…' : 'Excluir definitivamente'}</button>
      {busy && <button type="button" className="secondary" onClick={onLogout}>Sair da conta</button>}
    </div>
  </dialog>;
}
