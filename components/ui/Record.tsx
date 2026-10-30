export type UserRecord = {
  id?: string;
  role?: 'user' | 'admin';
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
          <dd>{key === 'postalCode' && user.postalCode?.length === 8 && /^[0-9]{8}$/.test(user.postalCode)
            ? user.postalCode!.slice(0, 5) + '-' + user.postalCode!.slice(5)
            : user[key as keyof typeof recordLabels] || 'Não informado'}</dd>
        </div>
      ))}
    </dl>
  );
}
