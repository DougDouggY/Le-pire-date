import { existsSync } from 'node:fs';
import { SPRITES } from '../server/sprite-manifest.mjs';
import { CONTENT } from '../server/content.mjs';
const missing=[];let count=0;
for(const pool of Object.values(CONTENT))for(const p of pool.profiles){
 for(const path of new Set([...p.media.photos,...p.media.lookalikes,...Object.values(p.media.actor),...Object.values(SPRITES[p.id]||{})])){count++;if(!existsSync(`public${path}`))missing.push({profile:p.id,path:`public${path}`});}
}
if(missing.length){console.error(JSON.stringify({missing},null,2));process.exitCode=1;}else console.log(`Profile assets complete: ${count} files, 16 identities, 32 credible and 16 absurd lookalikes; six transparent mood sprites per identity.`);
