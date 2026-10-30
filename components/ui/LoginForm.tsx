'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { requestMessage } from './messages';

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const sending = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');
    setMessage('');
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.ok) {
        form.reset();
        window.location.replace('/area');
        return;
      }
      setMessage(requestMessage(response.status, 'login'));
    } catch {
      setMessage('Não foi possível confirmar a entrada. Tente novamente quando sua conexão estiver disponível.');
    } finally {
      sending.current = false;
      setBusy(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }

  return (
    <form className="card login-card" onSubmit={submit} aria-busy={busy}>
      {message && <div className="notice error" role="alert" tabIndex={-1} ref={feedback}>{message}</div>}
      <div className="form-grid">
        <div className="field wide">
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" name="email" type="email" autoComplete="username" required disabled={busy} />
        </div>
        <div className="field wide">
          <label htmlFor="login-password">Senha</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" required maxLength={256} disabled={busy} />
        </div>
      </div>
      <div className="form-actions actions">
        <button type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <Link href="/cadastro">Criar cadastro</Link>
      </div>
    </form>
  );
}
