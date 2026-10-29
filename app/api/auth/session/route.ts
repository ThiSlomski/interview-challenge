import { auth } from '../../../../server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = auth.session;
