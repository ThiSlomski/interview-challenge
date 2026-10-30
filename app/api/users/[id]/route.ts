import { getUsers, deleteUser } from '../../../../server/users';

export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return getUsers(request, (await context.params).id);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return deleteUser(request, (await context.params).id);
}
