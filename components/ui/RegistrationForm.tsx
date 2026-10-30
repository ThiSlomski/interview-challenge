'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { registrationFields, validateRegistration } from '@/shared/registration.mjs';
import UserDetails, { type UserRecord } from './Record';
import { fieldMessages, requestMessage } from './messages';
import Weather from './Weather';

const fields = [
  ['name', 'Nome', 'text', 'name'],
  ['email', 'E-mail', 'email', 'email'],
  ['password', 'Senha', 'password', 'new-password'],
  ['passwordConfirmation', 'Confirmação de senha', 'password', 'new-password'],
  ['address', 'Endereço', 'text', 'street-address'],
  ['city', 'Cidade', 'text', 'address-level2'],
  ['state', 'Estado', 'text', 'address-level1'],
  ['country', 'País', 'text', 'country-name'],
  ['postalCode', 'CEP', 'text', 'postal-code'],
  ['message', 'Mensagem', 'textarea', 'off'],
];

export default function RegistrationForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<UserRecord | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const success = useRef<HTMLHeadingElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    if (summary) success.current?.focus();
    else if (message) feedback.current?.focus();
  }, [summary, message, errors]);

  function focusFeedback() {
    requestAnimationFrame(() => feedback.current?.focus());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const data = new FormData(event.currentTarget);
    const input = Object.fromEntries(registrationFields.map(field => [field, data.get(field) ?? '']));
    const checked = validateRegistration(input);
    setMessage('');
    setErrors({});
    if (!checked.ok) {
      setErrors(checked.errors as Record<string, string>);
      setMessage('Confira os campos indicados abaixo.');
      focusFeedback();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (response.status !== 201) {
        if (response.status === 400) {
          const body = await response.json().catch(() => null);
          if (body?.fields && typeof body.fields === 'object') {
            setErrors(Object.fromEntries(Object.keys(body.fields)
              .filter(key => registrationFields.includes(key))
              .map(key => [key, 'invalid'])));
          }
        }
        setMessage(requestMessage(response.status, 'registration'));
        focusFeedback();
        return;
      }
      // Only the confirmed submission's public fields survive this flow, in memory.
      const value = checked.value as unknown as UserRecord;
      form.current?.reset();
      setSummary({
        name: value.name, email: value.email, address: value.address,
        city: value.city, state: value.state, country: value.country,
        postalCode: value.postalCode, message: value.message,
      });
      requestAnimationFrame(() => success.current?.focus());
    } catch {
      setMessage('Não foi possível confirmar o cadastro. O resultado pode ter sido recebido pelo servidor. Confira se já consegue entrar antes de enviar novamente.');
      focusFeedback();
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (summary) {
    return <>
      <div className="page-heading">
        <p className="eyebrow">PRÓXIMO PASSO: ENTRAR</p>
        <h1 ref={success} tabIndex={-1}>Cadastro concluído</h1>
        <p>Seu cadastro foi criado. Você ainda precisa entrar para acessar a área protegida.</p>
      </div>
      <section className="card form-card" aria-label="Resumo do cadastro">
        <UserDetails user={summary} />
        <div className="actions registration-success-actions">
          <Link className="button" href="/login">Entrar na minha conta</Link>
          <Link href="/">Voltar ao início</Link>
        </div>
      </section>
      <Weather city={summary.city} state={summary.state} country={summary.country} />
    </>;
  }

  return <>
    <div className="page-heading">
      <p className="eyebrow">COMECE AQUI</p>
      <h1>Crie seu cadastro</h1>
      <p>Preencha seus dados para ter acesso à consulta na sua área.</p>
      <p>Já tem uma conta? <Link href="/login">Entrar</Link></p>
    </div>
    <form ref={form} className="card form-card" onSubmit={submit} noValidate aria-busy={busy}>
      <p className="required-note">E-mail, senha e confirmação de senha são obrigatórios. Os demais campos podem ficar em branco.</p>
      {message && <div ref={feedback} tabIndex={-1} role="alert" className="notice error">
        {message}
        {Object.keys(errors).length > 0 && <ul>
          {Object.keys(errors).filter(key => fieldMessages[key]).map(key => <li key={key}>
            <a href={'#' + key} onClick={event => {
              event.preventDefault();
              (form.current?.elements.namedItem(key) as HTMLElement | null)?.focus();
            }}>{fieldMessages[key]}</a>
          </li>)}
        </ul>}
      </div>}
      <div className="form-grid">
        {fields.map(([name, label, type, autocomplete]) => {
          const error = Boolean(errors[name]);
          const hint = name === 'password'
            ? 'Use de 8 a 35 letras e números.'
            : name === 'name' ? 'Até 150 caracteres.' : undefined;
          const props = {
            id: name, name, autoComplete: autocomplete,
            'aria-invalid': error || undefined,
            'aria-describedby': [hint ? name + '-hint' : '', error ? name + '-error' : ''].filter(Boolean).join(' ') || undefined,
            disabled: busy,
            required: ['email', 'password', 'passwordConfirmation'].includes(name),
          };
          return <div className={'field ' + (['address', 'message'].includes(name) ? 'wide' : '')} key={name}>
            <label htmlFor={name}>{label}</label>
            {type === 'textarea' ? <textarea {...props} /> : <input {...props} type={type} />}
            {hint && <span className="hint" id={name + '-hint'}>{hint}</span>}
            {error && <p className="field-error" id={name + '-error'}>{fieldMessages[name]}</p>}
          </div>;
        })}
      </div>
      <div className="form-actions">
        <button disabled={busy} type="submit">{busy ? 'Cadastrando…' : 'Criar cadastro'}</button>
      </div>
    </form>
  </>;
}
