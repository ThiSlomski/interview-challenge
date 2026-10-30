import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';

const grotesk = localFont({
  src: './fonts/space-grotesk-latin.woff2',
  variable: '--font-grotesk',
  weight: '300 700',
  display: 'swap',
});
const mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400.woff2', weight: '400' },
    { path: './fonts/ibm-plex-mono-latin-500.woff2', weight: '500' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cadastro e consulta | Slomski Solutions',
  description: 'Desafio técnico Imobilead desenvolvido por Slomski Solutions. Cadastro e consulta com autenticação.',
  icons: { icon: '/brand/slomski-solutions-mark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${grotesk.variable} ${mono.variable}`}>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <header className="site-header">
          <nav className="nav shell" aria-label="Navegação principal">
            <Link className="brand" href="/" aria-label="Slomski Solutions — início">
              <Image src="/brand/slomski-solutions-mark.svg" width={40} height={40} alt="" priority />
              <span className="brand-name"><span>SLOMSKI</span><span>SOLUTIONS</span></span>
            </Link>
            <div className="nav-links">
              <Link href="/cadastro">Cadastro</Link>
              <Link href="/login">Entrar</Link>
              <Link href="/area" prefetch={false}>Minha área</Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-content">
            <a className="brand footer-brand" href="https://www.slomskisolutions.com.br" target="_blank" rel="noopener noreferrer" aria-label="Acessar o site da Slomski Solutions">
              <Image src="/brand/slomski-solutions-mark.svg" width={40} height={40} alt="" />
              <span className="brand-name"><span>SLOMSKI</span><span>SOLUTIONS</span></span>
            </a>
            <p className="footer-slogan">Engenharia digital para um futuro real.</p>
            <p className="footer-copyright">© 2026 SLOMSKI SOLUTIONS</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
