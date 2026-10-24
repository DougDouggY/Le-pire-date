import { env } from 'cloudflare:workers';
import { act, createRoom, joinRoom, publicState, readRoom } from '../../../server/engine.mjs';
import { readActionBody, RequestError, validateRoomAccess } from '../../../server/request-guards.mjs';

const json = (body: unknown, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const db = () => {
  if (!env.DB) throw new Error('La base multijoueur est indisponible.');
  return env.DB;
};
export async function GET(request: Request) {
  try {
    const u=new URL(request.url), code=u.searchParams.get('code')?.toUpperCase(), bearer=request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
    if(!code||!bearer) return json({error:'Code et jeton requis.'},400);
    validateRoomAccess(code,bearer);
    const {room,role}=await readRoom(db(),code,bearer); return json(publicState(room,role));
  } catch(e) { return json({error:e instanceof Error?e.message:'Erreur serveur.'},e instanceof RequestError?e.status:403); }
}
export async function POST(request: Request) {
  try {
    const body=await readActionBody(request) as {type?:string;code?:string;token?:string;mode?:string;action?:Record<string,unknown>};
    if(body.type==='create') { const room=await createRoom(db(),body.mode); return json(room); }
    if(body.type==='join') {
      if(typeof body.code!=='string'||!/^[A-Z0-9]{8}$/.test(body.code.toUpperCase()))return json({error:'Code de salon invalide.'},400);
      return json(await joinRoom(db(),body.code.toUpperCase()));
    }
    if(!body.code||!body.token||!body.action) return json({error:'Requête incomplète.'},400);
    validateRoomAccess(body.code.toUpperCase(),body.token);
    return json(await act(db(),body.code.toUpperCase(),body.token,body.action as {type:string}));
  } catch(e) { return json({error:e instanceof Error?e.message:'Erreur serveur.'},e instanceof RequestError?e.status:400); }
}
