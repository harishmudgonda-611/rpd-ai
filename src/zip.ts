import { readFile } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';

function crc32(buf:Buffer):number{let c=0xffffffff;for(const byte of buf){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function u16(n:number){const b=Buffer.alloc(2);b.writeUInt16LE(n);return b}
function u32(n:number){const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b}

export async function createZip(files:{name:string;path:string}[]):Promise<Buffer>{
 const chunks:Buffer[]=[];const central:Buffer[]=[];let offset=0;
 for(const f of files){const raw=await readFile(f.path);const data=deflateRawSync(raw);const name=Buffer.from(f.name);const crc=crc32(raw);
  const local=Buffer.concat([Buffer.from([0x50,0x4b,0x03,0x04]),u16(20),u16(0),u16(8),u16(0),u16(0),u32(crc),u32(data.length),u32(raw.length),u16(name.length),u16(0),name,data]);
  chunks.push(local);
  central.push(Buffer.concat([Buffer.from([0x50,0x4b,0x01,0x02]),u16(20),u16(20),u16(0),u16(8),u16(0),u16(0),u32(crc),u32(data.length),u32(raw.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
  offset+=local.length;
 }
 const cd=Buffer.concat(central), body=Buffer.concat(chunks);
 const end=Buffer.concat([Buffer.from([0x50,0x4b,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(cd.length),u32(body.length),u16(0)]);
 return Buffer.concat([body,cd,end]);
}
