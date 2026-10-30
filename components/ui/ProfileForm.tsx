'use client';
import { useEffect, useRef, useState } from 'react';
import { profileFields, validateProfile } from '@/shared/profile.mjs';
import { requiredProfileFields } from '@/shared/registration.mjs';
import type { UserRecord } from './Record';
import { fieldMessage } from './messages';

export type ProfileSnapshot = { user: UserRecord; profileVersion: number; etag: string };
export type ProfileFeedback = { message: string; fields?: Record<string, string>; conflict?: boolean };
const fields = [
  ['name', 'Nome', 'name'], ['address', 'Endereço', 'street-address'],
  ['city', 'Cidade', 'address-level2'], ['state', 'Estado', 'address-level1'],
  ['country', 'País', 'country-name'], ['postalCode', 'CEP', 'postal-code'],
  ['message', 'Mensagem', 'off'],
];

export default function ProfileForm({ profile, busy, feedback, onSave, onCancel, onReload, embedded = false }: {
  profile: ProfileSnapshot; busy: boolean; feedback: ProfileFeedback | null;
  onSave: (input: Record<string, unknown>) => void; onCancel: () => void; onReload: () => void;
  embedded?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const alert = useRef<HTMLDivElement>(null);
  const [localFeedback, setLocalFeedback] = useState<ProfileFeedback | null>(null);
  const currentFeedback = localFeedback ?? feedback;
  useEffect(() => { form.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus(); }, []);
  useEffect(() => {
    if (!currentFeedback) return;
    const first = profileFields.find(field => Object.hasOwn(currentFeedback.fields ?? {}, field));
    if (first) (form.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
    else alert.current?.focus();
  }, [currentFeedback]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const input = { expectedVersion: profile.profileVersion, ...Object.fromEntries(profileFields.map((field: string) => [field, values.get(field) ?? ''])) };
    const result = validateProfile(input);
    if (!result.ok) {
      setLocalFeedback({ message: 'Confira os campos indicados abaixo.', fields: result.errors as Record<string, string> });
      return;
    }
    setLocalFeedback(null);
    onSave(input);
  }

  return <form ref={form} className="card form-card profile-form" aria-label="Editar meu cadastro" aria-busy={busy} onSubmit={submit} noValidate>
    {embedded ? <h3>Editar meu cadastro</h3> : <h2>Editar meu cadastro</h2>}
    <p className="required-note">Nome, cidade, estado e país são obrigatórios. Endereço, CEP e mensagem são opcionais. O e-mail identifica sua conta e não pode ser alterado nesta tela.</p>
    <div className="field profile-email"><label htmlFor="profile-email">E-mail</label><input id="profile-email" type="email" readOnly value={profile.user.email} autoComplete="email" aria-describedby="profile-email-hint" /><span id="profile-email-hint" className="hint">Identificador da conta, somente leitura.</span></div>
    {currentFeedback && <div ref={alert} tabIndex={-1} role="alert" className="notice error">
      {currentFeedback.message}
      {currentFeedback.fields && <ul>{Object.keys(currentFeedback.fields).filter(field => profileFields.includes(field)).map(field => <li key={field}><a href={'#profile-' + field} onClick={event => {
        event.preventDefault(); (form.current?.elements.namedItem(field) as HTMLElement | null)?.focus();
      }}>{fieldMessage(field, currentFeedback.fields?.[field])}</a></li>)}</ul>}
      {currentFeedback.conflict && <p>Seu rascunho foi mantido. Recarregar descarta o rascunho e mostra a versão atual do cadastro.</p>}
    </div>}
    <div className="form-grid">{fields.map(([name, label, autocomplete]) => {
      const error = Boolean(currentFeedback?.fields?.[name]);
      const hint = name === 'name' ? 'Até 150 caracteres.' : undefined;
      const props = {
        id: 'profile-' + name, name, autoComplete: autocomplete, disabled: busy,
        required: requiredProfileFields.includes(name),
        defaultValue: profile.user[name as keyof UserRecord] ?? '',
        'aria-invalid': error || undefined,
        'aria-describedby': [hint ? 'profile-' + name + '-hint' : '', error ? 'profile-' + name + '-error' : ''].filter(Boolean).join(' ') || undefined,
      };
      return <div className={'field ' + (['address', 'message'].includes(name) ? 'wide' : '')} key={name}>
        <label htmlFor={props.id}>{label}</label>
        {name === 'message' ? <textarea {...props} /> : <input {...props} type="text" />}
        {hint && <span className="hint" id={'profile-' + name + '-hint'}>{hint}</span>}
        {error && <p className="field-error" id={'profile-' + name + '-error'}>{fieldMessage(name, currentFeedback?.fields?.[name])}</p>}
      </div>;
    })}</div>
    <div className="form-actions actions">
      <button type="submit" disabled={busy || feedback?.conflict}>{busy ? 'Salvando…' : 'Salvar alterações'}</button>
      <button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar edição</button>
      {feedback?.conflict && <button type="button" className="secondary" disabled={busy} onClick={onReload}>Recarregar cadastro</button>}
    </div>
  </form>;
}
