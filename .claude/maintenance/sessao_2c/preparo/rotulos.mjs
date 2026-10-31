const {textoDaSpec}=await import('file:///C:/reviewbr/reviewbr/reviewbr-mcp/dist/services/method_trail.js');
const t=textoDaSpec('C:/reviewbr','scoping-prisma-scr');
const rot=new Map(); for (const m of t.matchAll(/^\|\s*([A-Z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+)\s*\|([^|]*)\|/gm)) if(!rot.has(m[1])) rot.set(m[1],m[2].trim());
for (const id of process.argv.slice(2)) console.log(id,'=>',rot.get(id));
