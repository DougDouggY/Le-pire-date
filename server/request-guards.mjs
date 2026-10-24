export class RequestError extends Error {
 constructor(message,status=400){super(message);this.status=status;}
}

export function validateRoomAccess(code,token){
 if(typeof code!=='string'||!/^[A-Z0-9]{8}$/.test(code))throw new RequestError('Code de salon invalide.');
 if(typeof token!=='string'||!/^[a-f0-9-]{72}$/.test(token))throw new RequestError('Jeton invalide.');
}

export async function readActionBody(request){
 const origin=request.headers.get('Origin');
 if((origin&&origin!==new URL(request.url).origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')throw new RequestError('Origine refusée.',403);
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new RequestError('JSON requis.',415);
 const reader=request.body?.getReader();
 if(!reader)throw new RequestError('Requête vide.');
 const chunks=[];let length=0;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  length+=value.byteLength;
  if(length>4096){await reader.cancel();throw new RequestError('Requête trop volumineuse.',413);}
  chunks.push(value);
 }
 const bytes=new Uint8Array(length);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let body;
 try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new RequestError('JSON invalide.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new RequestError('Requête invalide.');
 return body;
}
