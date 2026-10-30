'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AreaData } from '@/server/ui/area';
import UserDetails, { type UserRecord } from './Record';
import ProfileForm, { type ProfileFeedback, type ProfileSnapshot } from './ProfileForm';
import DeleteUserDialog from './DeleteUserDialog';
import { requestMessage } from './messages';

export default function Area({ data, hasAfter = false }: { data: AreaData; hasAfter?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshot, setSnapshot] = useState(data);
  const [editor, setEditor] = useState<ProfileSnapshot | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<ProfileFeedback | null>(null);
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sending = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const privateContent = useRef<HTMLDivElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const restoreEditFocus = useRef(false);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteOrigin = useRef<HTMLButtonElement | null>(null);
  const restoreDeleteFocus = useRef(false);
  const listTitle = useRef<HTMLHeadingElement>(null);
  const actions = useRef<{ check: () => void; logout: () => Promise<void>; edit: () => Promise<void>; save: (input: Record<string, unknown>) => Promise<void>; cancelEdit: () => void; askDelete: (user: UserRecord, origin: HTMLButtonElement) => void; cancelDelete: () => void; remove: () => Promise<void>; cancel: () => void } | null>(null);

  // Runs before paint, including when Next restores retained component state.
  // The DOM gate also closes during cleanup, without a state update in an effect.
  useLayoutEffect(() => {
    actions.current?.cancel();
    const content = privateContent.current;
    deleteDialog.current?.close();
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

  useLayoutEffect(() => {
    if (!deleteTarget && !busy && restoreDeleteFocus.current) {
      restoreDeleteFocus.current = false;
      if (privateContent.current?.hidden === false) {
        if (deleteOrigin.current?.isConnected) deleteOrigin.current.focus();
        else listTitle.current?.focus();
      }
    }
  }, [deleteTarget, busy]);

  useEffect(() => {
    type Operation = { generation: number; kind: 'check' | 'logout' | 'profile-load' | 'profile-save' | 'delete' | 'delete-refresh'; controller: AbortController; timeout?: ReturnType<typeof setTimeout> };
    let active = true, generation = 0, verified = false;
    let suspended = document.visibilityState !== 'visible';
    let current: Operation | null = null;
    let editing: ProfileSnapshot | null = null;
    let selected: UserRecord | null = null;
    const expires = new Date(data.expiresAt).getTime();

    function close() {
      if (!active) return;
      verified = false;
      // This gate closes synchronously, including from React lifecycle effects.
      // React state only controls presentation, never the private DOM gate.
      if (privateContent.current) privateContent.current.hidden = true;
      deleteDialog.current?.close();
      selected = null; restoreDeleteFocus.current = false;
      setDeleteTarget(null); setDeleting(false);
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
        if (kind === 'delete') { void reconcileUnknown(); return; }
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
    function isListing(value: unknown): value is { users: (UserRecord & { id: string })[]; nextCursor: string | null } {
      if (!value || typeof value !== 'object') return false;
      const payload = value as { users?: unknown; nextCursor?: unknown };
      const uuid = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
      if (!Array.isArray(payload.users) || payload.users.length > 100
          || !payload.users.every(user => isUser(user) && uuid(user.id) && (user.role === 'user' || user.role === 'admin'))) return false;
      if (payload.users.some((user, index, users) => index > 0 && users[index - 1].id >= user.id)) return false;
      return payload.nextCursor === null || (payload.users.length === 100 && uuid(payload.nextCursor) && payload.nextCursor === payload.users[99].id);
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
          ? isListing(payload)
          : isUser(payload?.user) && payload.user.id === data.own.id;
        if (!userMatches) { unavailable(operation); return; }
        // Own data must stay fresh even outside the current listing page.
        let own = payload.user;
        if (data.admin) {
          const response = await fetch('/api/users/' + encodeURIComponent(data.own.id!), options);
          if (!valid(operation)) return;
          if (response.status === 401) { expired(); return; }
          if (response.status === 403) { hide(); window.location.replace('/area'); return; }
          if (!response.ok) { unavailable(operation); return; }
          const profile = await response.json();
          if (!valid(operation)) return;
          if (!isUser(profile?.user) || profile.user.id !== data.own.id) { unavailable(operation); return; }
          own = profile.user;
        }
        const finalSession = await matchesSession(operation, options);
        if (!valid(operation) || !finalSession) return;
        if (data.admin && selected && !payload.users.some((user: UserRecord) => user.id === selected?.id && user.role === 'user')) {
          cancelDelete();
          setMessage('O cadastro selecionado não está mais disponível nesta página. Selecione novamente.');
        }
        // Refresh displayed values even when the identity and page membership
        // remain unchanged. An open editor owns its draft independently.
        setSnapshot(() => data.admin
          ? { ...data, own, users: payload.users, nextCursor: payload.nextCursor }
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
    function askDelete(user: UserRecord, origin: HTMLButtonElement) {
      if (!active || !data.admin || sending.current || editing || suspended || !verified || privateContent.current?.hidden !== false
          || user.role !== 'user' || user.id === data.own.id || typeof user.id !== 'string') return;
      invalidate();
      deleteOrigin.current = origin; restoreDeleteFocus.current = false;
      selected = user; setDeleteTarget(user); setSuccess(''); setMessage('');
    }
    function cancelDelete() {
      if (!active) return;
      if (sending.current) {
        // Escape dismisses only the confirmation. An already-sent operation
        // keeps its controller/generation and must still confirm then refetch.
        if (current?.kind === 'delete' || current?.kind === 'delete-refresh') {
          deleteDialog.current?.close(); selected = null; restoreDeleteFocus.current = true;
          setDeleteTarget(null); listTitle.current?.focus();
        }
        return;
      }
      deleteDialog.current?.close(); selected = null; restoreDeleteFocus.current = true; setDeleteTarget(null);
    }
    async function reloadAfterDelete(operation: Operation, text: string, successful: boolean) {
      const options = { cache: 'no-store' as const, credentials: 'same-origin' as const, signal: operation.controller.signal };
      if (!await matchesSession(operation, options) || !valid(operation)) return;
      const response = await fetch('/api/users' + window.location.search, options);
      if (!valid(operation)) return;
      if (response.status === 401) { expired(); return; }
      if (response.status === 403) { hide(); window.location.replace('/area'); return; }
      if (!response.ok) { unavailable(operation); return; }
      const payload = await response.json();
      if (!valid(operation)) return;
      if (!isListing(payload)) { unavailable(operation); return; }
      if (!await matchesSession(operation, options) || !valid(operation)) return;
      if (payload.users.length === 0 && hasAfter) { hide(); window.location.replace('/area'); return; }
      deleteDialog.current?.close(); selected = null; restoreDeleteFocus.current = true;
      setDeleteTarget(null); setDeleting(false);
      setSnapshot(previous => ({ ...previous, users: payload.users, nextCursor: payload.nextCursor }));
      if (successful) { setSuccess(text); setMessage(''); }
      else setMessage(text);
      finish(operation);
    }
    async function reconcileUnknown() {
      if (!active || suspended || document.visibilityState !== 'visible') return;
      const operation = begin('delete-refresh'); sending.current = true; setBusy(true);
      try {
        await reloadAfterDelete(operation, 'Não foi possível confirmar o resultado da exclusão. A listagem foi consultada novamente; confira os dados atuais antes de tentar outra vez.', false);
      } catch { unavailable(operation); }
    }
    async function remove() {
      if (!active || sending.current || suspended || !verified || !selected || selected.role !== 'user' || !data.admin || privateContent.current?.hidden !== false) return;
      if (Date.now() >= expires) { expired(); return; }
      const target = selected;
      const operation = begin('delete'); sending.current = true; setBusy(true); setDeleting(true); setMessage(''); setSuccess('');
      try {
        const options = { cache: 'no-store' as const, credentials: 'same-origin' as const, signal: operation.controller.signal };
        if (!await matchesSession(operation, options) || !valid(operation)) return;
        const response = await fetch('/api/users/' + encodeURIComponent(target.id!), { ...options, method: 'DELETE' });
        if (!valid(operation)) return;
        if (response.status === 401) { expired(); return; }
        if (response.status === 403) { hide(); window.location.replace('/area'); return; }
        if (response.status >= 500) { void reconcileUnknown(); return; }
        await reloadAfterDelete(operation, response.status === 204 ? 'Usuário excluído. As sessões dessa conta foram encerradas.'
          : response.status === 404 ? 'O usuário já não está cadastrado. A listagem foi atualizada.'
          : requestMessage(response.status, 'delete'), response.status === 204 || response.status === 404);
      } catch {
        if (!valid(operation)) return;
        void reconcileUnknown();
      }
    }
    async function logout() {
      if (!active || (sending.current && current?.kind !== 'delete' && current?.kind !== 'delete-refresh') || suspended || document.visibilityState !== 'visible') return;
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
    actions.current = { check: () => void check(), logout, edit, save, cancelEdit, askDelete, cancelDelete, remove, cancel: () => { active = false; suspended = true; deleteDialog.current?.close(); invalidate(true); } };
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
    function focus() {
      if (active && document.visibilityState === 'visible') {
        suspended = false;
        // Activation may arrive between pointerdown and click. Keep verified
        // admin controls mounted; hidden/expired contexts still fail closed.
        void check(data.admin ? 'background' : 'restrictive');
      }
    }
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
  }, [data, hasAfter]);

  const managedUsers = snapshot.users.filter(user => user.id !== data.own.id && user.role === 'user');
  const otherAdmins = snapshot.users.filter(user => user.id !== data.own.id && user.role === 'admin');

  return <>
    <div className="area-toolbar">
      <div><p className="eyebrow">{data.admin ? 'ACESSO ADMINISTRATIVO' : 'ACESSO PROTEGIDO'}</p>
        <h1>{data.admin ? 'Painel administrativo' : 'Minha área'}</h1>
        {data.admin && <p className="area-description">Gerencie os usuários cadastrados e mantenha seus dados administrativos atualizados.</p>}
      </div>
      <button className="secondary" onClick={() => void actions.current?.logout()} disabled={busy && !deleting}>{busy && !deleting ? 'Saindo…' : 'Sair'}</button>
    </div>
    {message && <div className="notice error" role="alert" ref={feedback} tabIndex={-1}>{message}</div>}
    {!visible && <section className="card"><p role="status">Seus dados estão ocultos enquanto verificamos o acesso.</p><button className="secondary" disabled={busy} onClick={() => actions.current?.check()}>Verificar acesso novamente</button></section>}
    {/* Constant SSR default: stale React renders must never reopen this gate. */}
    <div ref={privateContent} hidden>
      {deleteTarget && <DeleteUserDialog user={deleteTarget} busy={deleting} dialogRef={deleteDialog} onCancel={() => actions.current?.cancelDelete()} onConfirm={() => void actions.current?.remove()} onLogout={() => void actions.current?.logout()} />}
      {deleting && !deleteTarget && <p className="notice" role="status">A exclusão continua em processamento. Aguarde a confirmação e a atualização da listagem.</p>}
      {success && <p className="notice success" role="status">{success}</p>}
        <section className="area-section" aria-labelledby="own-profile-title">
          <h2 id="own-profile-title">{data.admin ? 'Meu cadastro administrativo' : 'Meu cadastro'}</h2>
          <div className={'profile-slot' + (data.admin ? ' admin-profile-slot' : '')}>
          {editor ? <ProfileForm key={editor.etag} embedded profile={editor} busy={busy} feedback={profileFeedback} onSave={input => void actions.current?.save(input)} onCancel={() => actions.current?.cancelEdit()} onReload={() => void actions.current?.edit()} /> : <article className={'card' + (data.admin ? ' record-card own-admin-card' : '')} aria-label={'Cadastro de ' + snapshot.own.name}>
            {data.admin && <p className="record-badge">Você · Administrador</p>}
            <UserDetails user={snapshot.own} omitEmptyMessage={data.admin} />
            <button ref={editButton} className="secondary profile-edit-action" disabled={busy} onClick={() => void actions.current?.edit()}>Editar meu cadastro</button>
          </article>}
          </div>
        </section>
      {data.admin && <>
        <section className="area-section" aria-labelledby="managed-users-title">
        <h2 id="managed-users-title" ref={listTitle} tabIndex={-1}>Usuários cadastrados</h2>
        <p className="section-description">Contas comuns cadastradas na plataforma.</p>
        {managedUsers.length === 0 ? <p className="notice">{snapshot.users.length === 0 ? 'Nenhum cadastro nesta página.' : 'Nenhuma conta comum nesta página. Os administradores estão apresentados separadamente.'}</p> : managedUsers.map(user =>
          <article className="card record-card" key={user.id} aria-label={'Cadastro de ' + user.name}>
            <UserDetails user={user} />
            {user.role === 'user' && user.id !== data.own.id && <button type="button" className="secondary danger delete-user-action" disabled={busy || Boolean(editor)} onClick={event => actions.current?.askDelete(user, event.currentTarget)}>Excluir usuário</button>}</article>)}
        </section>
        {otherAdmins.length > 0 && <section className="area-section" aria-labelledby="other-admins-title">
          <h2 id="other-admins-title">Outros administradores</h2>
          {otherAdmins.map(user => <article className="card record-card" key={user.id} aria-label={'Cadastro de ' + user.name}>
            <p className="record-badge">Administrador</p>
            <UserDetails user={user} />
          </article>)}
        </section>}
        {(hasAfter || snapshot.nextCursor) && <nav className="pager" aria-label="Paginação de usuários">
          <p className="pagination-context">A paginação percorre os cadastros de usuários e outros administradores. Seu cadastro permanece no topo.</p>
          {hasAfter && <a href="/area">Primeira página</a>}
          {snapshot.nextCursor && <a href={'/area?after=' + encodeURIComponent(snapshot.nextCursor)}>Próxima página</a>}
        </nav>}
      </>}
    </div>
  </>;
}
