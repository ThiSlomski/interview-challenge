'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AreaData } from '@/server/ui/area';
import UserDetails, { type UserRecord } from './Record';
import ProfileForm, { type ProfileFeedback, type ProfileSnapshot } from './ProfileForm';
import { requestMessage } from './messages';

export default function Area({ data, hasAfter = false }: { data: AreaData; hasAfter?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshot, setSnapshot] = useState(data);
  const [editor, setEditor] = useState<ProfileSnapshot | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<ProfileFeedback | null>(null);
  const [success, setSuccess] = useState('');
  const sending = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const privateContent = useRef<HTMLDivElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const restoreEditFocus = useRef(false);
  const actions = useRef<{ check: () => void; logout: () => Promise<void>; edit: () => Promise<void>; save: (input: Record<string, unknown>) => Promise<void>; cancelEdit: () => void; cancel: () => void } | null>(null);

  // Runs before paint, including when Next restores retained component state.
  // The DOM gate also closes during cleanup, without a state update in an effect.
  useLayoutEffect(() => {
    actions.current?.cancel();
    const content = privateContent.current;
    if (content) content.hidden = true;
    return () => { actions.current?.cancel(); if (content) content.hidden = true; };
  }, [data]);

  // The edit button is remounted when the editor closes. Focus only after
  // React has committed that DOM, rather than racing a requestAnimationFrame
  // against the concurrent render. Never focus content behind the private gate.
  useLayoutEffect(() => {
    if (!editor && !busy && restoreEditFocus.current) {
      restoreEditFocus.current = false;
      if (privateContent.current?.hidden === false) editButton.current?.focus();
    }
  }, [editor, busy]);

  useEffect(() => {
    type Operation = { generation: number; kind: 'check' | 'logout' | 'profile-load' | 'profile-save'; controller: AbortController; timeout?: ReturnType<typeof setTimeout> };
    let active = true, generation = 0, verified = false;
    let suspended = document.visibilityState !== 'visible';
    let current: Operation | null = null;
    let editing: ProfileSnapshot | null = null;
    const expires = new Date(data.expiresAt).getTime();

    function close() {
      if (!active) return;
      verified = false;
      // This gate closes synchronously, including from React lifecycle effects.
      // React state only controls presentation, never the private DOM gate.
      if (privateContent.current) privateContent.current.hidden = true;
      setVisible(false);
      editing = null;
      restoreEditFocus.current = false;
      setEditor(null);
      setProfileFeedback(null);
      setSuccess('');
    }
    function invalidate(silent = false) {
      generation++;
      const previous = current;
      current = null;
      if (previous) {
        clearTimeout(previous.timeout);
        previous.controller.abort();
        if (previous.kind !== 'check') {
          sending.current = false;
          if (active && !silent) setBusy(false);
        }
      }
    }
    function owns(operation: Operation) {
      return active && current === operation && generation === operation.generation && !operation.controller.signal.aborted;
    }
    function valid(operation: Operation) {
      return owns(operation) && !suspended && document.visibilityState === 'visible'
        && (operation.kind !== 'check' || !sending.current) && Date.now() < expires;
    }
    function finish(operation: Operation) {
      if (!owns(operation)) return;
      clearTimeout(operation.timeout);
      current = null;
      if (operation.kind !== 'check') { sending.current = false; setBusy(false); }
    }
    function hide() { if (!active) return; invalidate(); close(); }
    function expired() {
      if (!active) return;
      hide();
      if (active) window.location.replace('/login');
    }
    function begin(kind: Operation['kind']) {
      invalidate();
      const operation: Operation = { generation, kind, controller: new AbortController() };
      current = operation;
      operation.timeout = setTimeout(() => {
        if (!owns(operation)) return;
        hide();
        if (active) setMessage(kind === 'logout'
          ? 'Não foi possível confirmar a saída no prazo. Verifique o acesso ou tente sair novamente.'
          : kind === 'profile-save' ? 'Não foi possível confirmar a alteração no prazo. Verifique o acesso para conferir os dados atuais antes de editar novamente.'
          : 'A verificação demorou mais que o esperado. Verifique o acesso novamente.');
      }, 8000);
      return operation;
    }
    function unavailable(operation: Operation) {
      if (!valid(operation)) return;
      close();
      setMessage('Não foi possível verificar sua sessão. Verifique o acesso novamente.');
      finish(operation);
    }
    function isUser(value: unknown): value is UserRecord & { id: string } {
      if (!value || typeof value !== 'object') return false;
      const user = value as Record<string, unknown>;
      return typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string'
        && ['address', 'city', 'state', 'country', 'postalCode', 'message'].every(key => user[key] === null || typeof user[key] === 'string');
    }
    function profileSnapshot(value: unknown, etag: string | null): ProfileSnapshot | null {
      if (!value || typeof value !== 'object') return null;
      const profile = value as { user?: unknown; profileVersion?: unknown };
      if (!isUser(profile.user) || profile.user.id !== data.own.id
          || typeof profile.profileVersion !== 'number' || !Number.isInteger(profile.profileVersion)
          || profile.profileVersion < 1 || profile.profileVersion > 2147483647
          || etag !== `"profile:${profile.user.id}:${profile.profileVersion}"`) return null;
      return { user: profile.user, profileVersion: profile.profileVersion, etag };
    }
    async function matchesSession(operation: Operation, options: RequestInit) {
      const response = await fetch('/api/auth/session', options);
      if (!valid(operation)) return false;
      if (response.status === 401) { expired(); return false; }
      if (!response.ok) { unavailable(operation); return false; }
      const session = await response.json();
      if (!valid(operation)) return false;
      if (typeof session?.user?.id !== 'string' || !Number.isFinite(Date.parse(session.expiresAt))) {
        unavailable(operation); return false;
      }
      if (Date.parse(session.expiresAt) <= Date.now()) { expired(); return false; }
      if (session.user.id !== data.own.id) { hide(); window.location.replace('/area'); return false; }
      // Sessions have an absolute lifetime. A changed deadline is a different
      // session context, even if its owner happens to be the same user.
      if (Date.parse(session.expiresAt) !== expires) { unavailable(operation); return false; }
      return true;
    }
    async function check(mode: 'restrictive' | 'background' = 'restrictive') {
      if (!active || sending.current || suspended || document.visibilityState !== 'visible') return;
      if (!Number.isFinite(expires) || Date.now() >= expires) { expired(); return; }
      // The interval cannot supersede a restrictive check or another pending
      // operation. Only a still-visible, previously verified snapshot qualifies.
      if (mode === 'background' && current) return;
      const background = mode === 'background' && verified && privateContent.current?.hidden === false;
      const operation = begin('check');
      setBusy(false);
      if (!background) close();
      setMessage('');
      try {
        const options = { cache: 'no-store' as const, credentials: 'same-origin' as const, signal: operation.controller.signal };
        const initialSession = await matchesSession(operation, options);
        if (!valid(operation) || !initialSession) return;
        // Reuse the API's fresh role/ownership check before revealing cached data.
        const permission = await fetch(data.admin ? '/api/users' + window.location.search : '/api/users/' + encodeURIComponent(data.own.id!), options);
        if (!valid(operation)) return;
        if (permission.status === 401) { expired(); return; }
        if (permission.status === 403) { hide(); window.location.replace('/area'); return; }
        if (!permission.ok) { unavailable(operation); return; }
        const payload = await permission.json();
        if (!valid(operation)) return;
        const userMatches = data.admin
          ? Array.isArray(payload?.users) && payload.users.length === data.users.length
            && payload.users.every((user: unknown, index: number) => isUser(user) && user.id === data.users[index].id)
            && payload.nextCursor === data.nextCursor
          : isUser(payload?.user) && payload.user.id === data.own.id;
        if (!userMatches) { unavailable(operation); return; }
        const finalSession = await matchesSession(operation, options);
        if (!valid(operation) || !finalSession) return;
        // Refresh displayed values even when the identity and page membership
        // remain unchanged. An open editor owns its draft independently.
        setSnapshot(previous => data.admin
          ? { ...data, own: payload.users.find((user: UserRecord) => user.id === data.own.id) ?? previous.own, users: payload.users, nextCursor: payload.nextCursor }
          : { ...data, own: payload.user });
        verified = true;
        if (!background) {
          if (privateContent.current) privateContent.current.hidden = false;
          setVisible(true);
        }
        finish(operation);
      } catch { unavailable(operation); }
    }
    async function edit() {
      if (!active || sending.current || suspended || !verified || privateContent.current?.hidden !== false) return;
      if (Date.now() >= expires) { expired(); return; }
      const operation = begin('profile-load');
      sending.current = true; setBusy(true); setProfileFeedback(null); setSuccess('');
      // Reload is an explicit draft discard, including when the ETag happens
      // to remain unchanged after an uncertain earlier response.
      editing = null; setEditor(null);
      try {
        const options = { cache: 'no-store' as const, credentials: 'same-origin' as const, signal: operation.controller.signal };
        if (!await matchesSession(operation, options) || !valid(operation)) return;
        const response = await fetch('/api/profile', options);
        if (!valid(operation)) return;
        if (response.status === 401) { expired(); return; }
        if (response.status === 403) { hide(); window.location.replace('/area'); return; }
        if (!response.ok) { unavailable(operation); return; }
        const profile = profileSnapshot(await response.json(), response.headers.get('etag'));
        if (!valid(operation)) return;
        if (!profile) { unavailable(operation); return; }
        if (!await matchesSession(operation, options) || !valid(operation)) return;
        setSnapshot(previous => ({ ...previous, own: profile.user, users: previous.users.map(user => user.id === profile.user.id ? profile.user : user) }));
        editing = profile;
        setEditor(profile);
        finish(operation);
      } catch { unavailable(operation); }
    }
    async function save(input: Record<string, unknown>) {
      if (!active || sending.current || suspended || !verified || !editing || privateContent.current?.hidden !== false) return;
      if (Date.now() >= expires) { expired(); return; }
      const profile = editing;
      const operation = begin('profile-save');
      sending.current = true; setBusy(true); setProfileFeedback(null); setSuccess('');
      try {
        const options = { cache: 'no-store' as const, credentials: 'same-origin' as const, signal: operation.controller.signal };
        if (!await matchesSession(operation, options) || !valid(operation)) return;
        const response = await fetch('/api/profile', {
          ...options, method: 'PATCH', headers: { 'Content-Type': 'application/json', 'If-Match': profile.etag },
          body: JSON.stringify({ ...input, expectedVersion: profile.profileVersion }),
        });
        if (!valid(operation)) return;
        if (response.status === 401) { expired(); return; }
        if (response.status === 403) { hide(); window.location.replace('/area'); return; }
        const payload = await response.json().catch(() => null);
        if (!valid(operation)) return;
        if (!await matchesSession(operation, options) || !valid(operation)) return;
        if (!response.ok) {
          if (response.status >= 500) { unavailable(operation); return; }
          setProfileFeedback({
            message: requestMessage(response.status, 'profile'), conflict: response.status === 409 || response.status === 428,
            fields: response.status === 400 && payload?.fields && typeof payload.fields === 'object' ? payload.fields : undefined,
          });
          finish(operation);
          return;
        }
        const updated = profileSnapshot(payload, response.headers.get('etag'));
        if (!updated || updated.profileVersion !== profile.profileVersion + 1) { unavailable(operation); return; }
        setSnapshot(previous => ({ ...previous, own: updated.user, users: previous.users.map(user => user.id === updated.user.id ? updated.user : user) }));
        editing = null; restoreEditFocus.current = true; setEditor(null); setSuccess('Cadastro atualizado com sucesso.');
        finish(operation);
      } catch {
        if (!valid(operation)) return;
        hide();
        setMessage('Não foi possível confirmar a alteração. Verifique o acesso para conferir os dados atuais antes de editar novamente.');
      }
    }
    function cancelEdit() {
      if (!active || sending.current) return;
      editing = null; restoreEditFocus.current = true; setEditor(null); setProfileFeedback(null);
    }
    async function logout() {
      if (!active || sending.current || suspended || document.visibilityState !== 'visible') return;
      if (Date.now() >= expires) { expired(); return; }
      const operation = begin('logout');
      close(); sending.current = true; setBusy(true); setMessage('');
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: operation.controller.signal,
        });
        if (!valid(operation)) return;
        if (response.ok) { hide(); window.location.replace('/login'); return; }
        setMessage(requestMessage(response.status, 'logout'));
        finish(operation);
      } catch {
        if (!valid(operation)) return;
        setMessage(requestMessage(503, 'logout'));
        finish(operation);
      }
    }
    actions.current = { check: () => void check(), logout, edit, save, cancelEdit, cancel: () => { active = false; suspended = true; invalidate(true); } };
    void check();
    const expiry = setTimeout(expired, Math.max(0, expires - Date.now()));
    const interval = setInterval(() => void check('background'), 30000);
    function hidden() {
      if (!active) return;
      suspended = document.visibilityState !== 'visible';
      hide();
      if (!suspended) void check();
    }
    function restored() { if (!active) return; suspended = document.visibilityState !== 'visible'; hide(); if (!suspended) void check(); }
    function pagehide() { if (!active) return; suspended = true; hide(); }
    function focus() { if (active && document.visibilityState === 'visible') { suspended = false; void check(); } }
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', pagehide);
    window.addEventListener('pageshow', restored);
    window.addEventListener('focus', focus);
    return () => {
      active = false;
      invalidate();
      actions.current = null;
      clearTimeout(expiry); clearInterval(interval);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', restored);
      window.removeEventListener('focus', focus);
    };
  }, [data]);

  return <>
    <div className="area-toolbar">
      <div><p className="eyebrow">{data.admin ? 'ACESSO ADMINISTRATIVO' : 'ACESSO PROTEGIDO'}</p>
        <h1>{data.admin ? 'Painel administrativo' : 'Minha área'}</h1>
        {data.admin && <p className="area-description">Consulte os usuários cadastrados na plataforma.</p>}
      </div>
      <button className="secondary" onClick={() => void actions.current?.logout()} disabled={busy}>{busy ? 'Saindo…' : 'Sair'}</button>
    </div>
    {message && <div className="notice error" role="alert" ref={feedback} tabIndex={-1}>{message}</div>}
    {!visible && <section className="card"><p role="status">Seus dados estão ocultos enquanto verificamos o acesso.</p><button className="secondary" disabled={busy} onClick={() => actions.current?.check()}>Verificar acesso novamente</button></section>}
    {/* Constant SSR default: stale React renders must never reopen this gate. */}
    <div ref={privateContent} hidden>
      {success && <p className="notice success" role="status">{success}</p>}
      {editor && <ProfileForm key={editor.etag} profile={editor} busy={busy} feedback={profileFeedback} onSave={input => void actions.current?.save(input)} onCancel={() => actions.current?.cancelEdit()} onReload={() => void actions.current?.edit()} />}
      {!data.admin && <section className="card"><h2>Meu cadastro</h2><UserDetails user={snapshot.own} />
        {!editor && <button ref={editButton} className="secondary profile-edit-action" disabled={busy} onClick={() => void actions.current?.edit()}>Editar meu cadastro</button>}
      </section>}
      {data.admin && <section className="area-section">
        {!editor && <div className="profile-actions"><button ref={editButton} className="secondary" disabled={busy} onClick={() => void actions.current?.edit()}>Editar meu cadastro</button></div>}
        <h2>Usuários cadastrados</h2>
        {snapshot.users.length === 0 ? <p className="notice">Nenhum cadastro nesta página.</p> : snapshot.users.map(user =>
          <article className="card record-card" key={user.id} aria-label={'Cadastro de ' + user.name}>
            {user.id === data.own.id && <p className="record-badge">Você · Administrador</p>}
            <UserDetails user={user} /></article>)}
        {(hasAfter || snapshot.nextCursor) && <nav className="pager" aria-label="Paginação de usuários">
          {hasAfter && <a href="/area">Primeira página</a>}
          {snapshot.nextCursor && <a href={'/area?after=' + encodeURIComponent(snapshot.nextCursor)}>Próxima página</a>}
        </nav>}
      </section>}
    </div>
  </>;
}
