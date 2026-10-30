export type UserRecord = {
  id?: string;
  name: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  message: string | null;
};
export const recordLabels = {
  name: 'Nome', email: 'E-mail', address: 'Endereço', city: 'Cidade',
  state: 'Estado', country: 'País', postalCode: 'CEP', message: 'Mensagem',
};

export default function UserDetails({ user }: { user: UserRecord }) {
  return (
    <dl className="record">
      {Object.entries(recordLabels).map(([key, label]) => (
        <div key={key} className={key === 'message' ? 'wide' : undefined}>
          <dt>{label}</dt>
          <dd>{user[key as keyof typeof recordLabels] || 'Não informado'}</dd>
        </div>
      ))}
    </dl>
  );
}
