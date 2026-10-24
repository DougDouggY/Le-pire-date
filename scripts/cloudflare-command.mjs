import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateConfig(config,{remote=false}={}){
 const binding=config.d1_databases?.[0];
 if(config.name!=='le-pire-date'||config.main!=='worker/cloudflare.ts'||config.d1_databases?.length!==1||binding?.binding!=='DB'||binding?.database_name!=='le-pire-date-db'||binding?.migrations_dir!=='./drizzle')throw Error('Configuration LE PIRE DATE inattendue : opération refusée.');
 if(config.routes||config.route||config.services||config.kv_namespaces||config.r2_buckets)throw Error('Cette configuration ne doit cibler aucun autre service ou domaine.');
 if(config.assets?.directory!=='./public'||JSON.stringify(config.assets.run_worker_first)!==JSON.stringify(['/api/*']))throw Error('Le jeu statique et son API doivent rester séparés.');
 if(remote&&(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(binding.database_id)||binding.database_id==='00000000-0000-4000-8000-000000000000'))throw Error('Renseigner dans wrangler.le-pire-date.json le database_id de la NOUVELLE base le-pire-date-db avant toute opération distante.');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const configPath='wrangler.le-pire-date.json';
 const action=process.argv[2];
 if(!['check','create','deploy','migrate'].includes(action))throw Error('Utiliser check, create, deploy ou migrate.');
 const config=JSON.parse(readFileSync(configPath,'utf8'));
 validateConfig(config,{remote:['deploy','migrate'].includes(action)});
 const args=action==='check'?['deploy','--dry-run','--outdir','.sites-runtime/cloudflare-check']:
  action==='create'?['d1','create','le-pire-date-db']:action==='deploy'?['deploy']:['d1','migrations','apply','le-pire-date-db','--remote'];
 const result=spawnSync(process.execPath,['./node_modules/wrangler/bin/wrangler.js',...args,'--config',configPath],{stdio:'inherit'});
 if(result.error)throw result.error;
 process.exit(result.status??1);
}
