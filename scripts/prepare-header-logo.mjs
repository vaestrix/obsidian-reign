import sharp from 'sharp';import {readFile,mkdir} from 'node:fs/promises';
await mkdir('audit-results',{recursive:true});
for(const [kind,width,name]of [['HEADER',108,'studio-logo-header.webp'],['HERO',640,'studio-logo-web.webp']]){
 const output='audit-results/'+name;await sharp('assets/img/studio-logo.png').resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(output);const bytes=await readFile(output);console.log(kind+'_WEBP_INFO '+JSON.stringify({bytes:bytes.length,metadata:await sharp(bytes).metadata()}));
}
