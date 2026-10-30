import Link from 'next/link';

export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell home">
      <p className="eyebrow">CADASTRO E CONSULTA</p>
      <h1>Seus dados,<br /><span>em um só lugar.</span></h1>
      <p className="lead">Crie seu cadastro e entre para consultar suas informações com segurança.</p>
      <p className="project-context">Desafio técnico Imobilead · Desenvolvido por Slomski Solutions</p>
      <div className="actions">
        <Link className="button" href="/cadastro">Criar cadastro</Link>
        <Link className="button secondary" href="/login">Entrar</Link>
      </div>
      <section className="card home-card">
        <h2>Já tem uma sessão aberta?</h2>
        <p>Acesse sua área para consultar o cadastro ou encerrar a sessão.</p>
        <Link href="/area" prefetch={false}>Acessar minha área →</Link>
      </section>
    </main>
  );
}
