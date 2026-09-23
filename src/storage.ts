import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');

export function useSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export function requireProductionStorage(): void {
  if (process.env.NODE_ENV === 'production' && !useSupabase()) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production');
}
function endpoint(table:string, query=''):string {
  return String(process.env.SUPABASE_URL||'').replace(/\/$/,'') + '/rest/v1/' + table + query;
}
async function supabaseFetch<T>(table:string, init:RequestInit={}, query=''):Promise<T> {
  const response=await fetch(endpoint(table,query),{...init,headers:{apikey:String(process.env.SUPABASE_SERVICE_ROLE_KEY),Authorization:'Bearer '+String(process.env.SUPABASE_SERVICE_ROLE_KEY),'Content-Type':'application/json',...(init.headers||{})}});
  const text=await response.text(); if(!response.ok) throw new Error('Supabase '+response.status+': '+text.slice(0,500)); return (text?JSON.parse(text):null) as T;
}
export async function dbSelect<T>(table:string,query=''):Promise<T[]>{return (await supabaseFetch<T[]>(table,{},query))||[]}
export async function dbInsert<T>(table:string,row:unknown):Promise<T>{const r=await supabaseFetch<T|T[]>(table,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(row)});return Array.isArray(r)?r[0]:r as T}
export async function dbUpsert<T>(table:string,row:unknown,onConflict:string):Promise<T>{const r=await supabaseFetch<T|T[]>(table,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)},'?on_conflict='+encodeURIComponent(onConflict));return Array.isArray(r)?r[0]:r as T}
export async function dbUpdate<T>(table:string,row:unknown,filter:string):Promise<T|null>{const r=await supabaseFetch<T|T[]>(table,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(row)},'?'+filter);return Array.isArray(r)?(r[0]||null):r}
export async function localRead<T>(filename:string,fallback:T):Promise<T>{await mkdir(DATA_DIR,{recursive:true});try{return JSON.parse(await readFile(join(DATA_DIR,filename),'utf8')) as T}catch{return fallback}}
export async function localWrite(filename:string,value:unknown):Promise<void>{await mkdir(DATA_DIR,{recursive:true});await writeFile(join(DATA_DIR,filename),JSON.stringify(value,null,2),'utf8')}
