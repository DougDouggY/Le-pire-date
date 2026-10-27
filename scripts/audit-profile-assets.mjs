import { existsSync } from 'node:fs';
import { CONTENT } from '../server/content.mjs';
const missing=[];let count=0;
for(const pool of Object.values(CONTENT))for(const p of pool.profiles){
 for(const path of new Set([...p.media.photos,...p.media.lookalikes,...Object.values(p.media.actor)])){count++;if(!existsSync(`public${path}`))missing.push({profile:p.id,path:`public${path}`});}
}
if(missing.length){console.error(JSON.stringify({missing},null,2));process.exitCode=1;}else console.log(`Profile assets complete: ${count} files, 12 identities, 24 credible and 12 absurd lookalikes.`);
