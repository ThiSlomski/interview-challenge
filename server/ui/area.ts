import 'server-only';
import { database } from '../db';
import { authenticateSession } from '../auth/session.mjs';
import { mayRead, validId } from '../users/policy.mjs';
import { readUsers } from '../users/repository.mjs';
import type { UserRecord } from '@/components/ui/Record';

export type AreaData = { expiresAt:string; own:UserRecord; admin:boolean; users:UserRecord[]; nextCursor:string|null };
export async function loadArea(cookie:string,after:unknown):Promise<{status:'ok';data:AreaData}|{status:'anonymous'|'unavailable'|'forbidden'|'invalid'}>{
 try{
  const session=await authenticateSession({database,cookie,config:{origin:process.env.APP_ORIGIN??'',ttl:process.env.SESSION_TTL_SECONDS,production:process.env.NODE_ENV==='production'}});
  if(!session||!validId(session.user.id))return {status:'anonymous'};
  const db=await database();
  const {rows}=await db.query('SELECT id,role FROM imobilead.users WHERE id=$1',[session.user.id]);
  const actor=rows.length===1&&rows[0].id===session.user.id?rows[0]:null;
  if(!mayRead(actor,session.user.id))return {status:'forbidden'};
  const admin=mayRead(actor,undefined);
  if(after!==undefined&&(!admin||typeof after!=='string'||!validId(after)))return {status:'invalid'};
  const own=await readUsers(db,{id:session.user.id,after:undefined});
  if(!own)return {status:'forbidden'};
  const listing=(admin?await readUsers(db,{id:undefined,after:after??null}):{users:[],nextCursor:null}) as {users:UserRecord[];nextCursor:string|null};
  return {status:'ok',data:{expiresAt:session.expiresAt,own:own as UserRecord,admin,users:listing.users,nextCursor:listing.nextCursor}};
 }catch{return {status:'unavailable'};}
}
