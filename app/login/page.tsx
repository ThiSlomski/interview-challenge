import LoginForm from '@/components/ui/LoginForm';

export default function LoginPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell page">
      <div className="page-heading">
        <p className="eyebrow">BEM-VINDO DE VOLTA</p>
        <h1>Entre na sua conta</h1>
        <p>Acesse seus dados com seu e-mail e senha.</p>
      </div>
      <LoginForm />
    </main>
  );
}
