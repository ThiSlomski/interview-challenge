import Link from 'next/link';

export default function Home() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell home">
      <div className="home-copy">
        <p className="eyebrow">CADASTRO E CONSULTA</p>
        <h1>Seus dados,<br /><span>em um só lugar.</span></h1>
        <p className="lead">Crie seu cadastro e entre para consultar suas informações com segurança.</p>
        <p className="project-context">Desafio técnico Imobilead · Desenvolvido por Thiago Slomski</p>
        <div className="actions">
          <Link className="button" href="/cadastro">Criar cadastro</Link>
          <Link className="button secondary" href="/login">Entrar</Link>
        </div>
      </div>
      <section className="card home-benefits" aria-label="Benefícios da aplicação">
        <ul>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
            </svg>
            <div><h2>Cadastro seguro</h2><p>Senha protegida e validação no cliente e no servidor.</p></div>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
              <path d="m8 12 3 3 5-6" />
            </svg>
            <div><h2>Área protegida</h2><p>Cada usuário acessa somente os dados permitidos pelo seu papel.</p></div>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 3v2m-6 4h2m.5-5.5L6 5m7.5-1.5L12 5M5 12a4 4 0 1 1 7-4" />
              <path d="M7 20a4 4 0 0 1 0-8h1a5 5 0 0 1 10-1 4.5 4.5 0 0 1 0 9H7Z" />
            </svg>
            <div><h2>Previsão de amanhã</h2><p>Consulta meteorológica exibida após a conclusão do cadastro.</p></div>
          </li>
        </ul>
      </section>
    </main>
  );
}
