export const fieldMessages: Record<string, string> = {
  name: 'Informe um nome com até 150 caracteres.',
  email: 'Informe um e-mail válido, com até 254 caracteres.',
  password: 'Use de 8 a 35 letras e números, sem espaços ou símbolos.',
  passwordConfirmation: 'As senhas devem ser iguais.',
  address: 'Revise o endereço informado.',
  city: 'Revise a cidade informada.',
  state: 'Revise o estado informado.',
  country: 'Revise o país informado.',
  postalCode: 'Revise o CEP informado.',
  message: 'Revise a mensagem informada.',
};

export function requestMessage(status: number, action: 'registration' | 'login' | 'logout') {
  if (status === 429) return 'Muitas tentativas. Aguarde um momento antes de tentar novamente.';
  if (status === 409 && action === 'registration') return 'Não foi possível cadastrar este e-mail. Se já tem cadastro, entre com sua conta.';
  if (status === 401 && action === 'login') return 'E-mail ou senha incorretos.';
  if (status === 413) return 'O conteúdo é muito longo. Reduza os textos e tente novamente.';
  if (status === 400) return 'Revise os dados informados e tente novamente.';
  if (status === 403) return 'Não foi possível autorizar esta solicitação. Recarregue a página e tente novamente.';
  if (action === 'logout') return 'Não foi possível encerrar a sessão. Tente sair novamente.';
  return 'O serviço está indisponível no momento. Tente novamente mais tarde.';
}
