import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadArea } from '@/server/ui/area';
import Area from '@/components/ui/Area';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AreaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const result = await loadArea((await cookies()).toString(), params.after);
  if (result.status === 'anonymous') redirect('/login');
  if (result.status !== 'ok') {
    const message = result.status === 'unavailable'
      ? 'Sua área está temporariamente indisponível. Tente novamente mais tarde.'
      : result.status === 'invalid'
        ? 'Esta página de resultados não está disponível.'
        : 'Não foi possível autorizar o acesso a esta área.';
    return (
      <main id="conteudo" tabIndex={-1} className="shell page">
        <h1>Minha área</h1>
        <div className="notice error" role="alert">{message}</div>
        <a className="button" href="/area">Tentar novamente</a>
      </main>
    );
  }
  return (
    <main id="conteudo" tabIndex={-1} className="shell page">
      <Area data={result.data} hasAfter={params.after !== undefined} />
    </main>
  );
}
