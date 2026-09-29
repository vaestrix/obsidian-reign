const ADMIN_USER = "admin";
const ADMIN_PASSWORD_SHA256 = "d5489258ff6090d90c49c9816b75d46240541b2a8c653daa33439364e672743f";

const VALID_CLASSES = ["Templar","Gladiator","Assassin","Ranger","Sorcerer","Spiritmaster","Cleric","Chanter"];

const DEFAULT_STATE = {
  news: [
    { id:"news-recruiting", title:"Obsidian Reign Is Recruiting", date:"2026-09-28", category:"Guild", excerpt:"We’re building a serious core for Aion 2 Global. Organized, social, and here for the long run." }
  ],
  raids: [
    { id:"raid-early-access", name:"Early Access Launch Night", date:"2026-09-30", time:"7:00 PM CT", status:"Main Event" }
  ],
  roster: [
    { id:"member-vaestrix", name:"Vaestrix", role:"Guild Leader", className:"Templar", interest:"Both", status:"Active" }
  ],
  applications: [],
  settings: {
    discord:"https://discord.gg/docgotgame",
    server:"Zikel • NA East",
    recruitment:"Open"
  }
};

function uid(prefix="id"){
  return prefix+"-"+Date.now().toString(36)+"-"+crypto.randomUUID().slice(0,8);
}

function safeString(v,max=500){
  return String(v??"").trim().slice(0,max);
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function authorized(request) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const splitAt = decoded.indexOf(":");
    if (splitAt < 0) return false;
    const username = decoded.slice(0, splitAt);
    const password = decoded.slice(splitAt + 1);
    return username === ADMIN_USER && (await sha256Hex(password)) === ADMIN_PASSWORD_SHA256;
  } catch { return false; }
}

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Obsidian Reign Legion Command", charset="UTF-8"',
      "Cache-Control":"no-store"
    }
  });
}

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "Content-Type":"application/json; charset=UTF-8",
      "Cache-Control":"no-store"
    }
  });
}

export class CommandStore {
  constructor(ctx, env){
    this.ctx=ctx;
  }

  async state(){
    let s=await this.ctx.storage.get("state");
    if(!s){
      s=structuredClone(DEFAULT_STATE);
      await this.ctx.storage.put("state",s);
    }
    s.news ||= [];
    s.raids ||= [];
    s.raids = s.raids.map(r=>({
      ...r,
      allowSignups:Boolean(r.allowSignups),
      signups:Array.isArray(r.signups)?r.signups:[]
    }));
    s.roster ||= [];
    s.applications ||= [];
    s.settings = {...DEFAULT_STATE.settings,...(s.settings||{})};
    return s;
  }

  async save(s){
    await this.ctx.storage.put("state",s);
    return s;
  }

  async fetch(request){
    const url=new URL(request.url);
    const s=await this.state();

    if(request.method==="GET" && url.pathname==="/state"){
      return json(s);
    }

    if(request.method==="GET" && url.pathname==="/public"){
      return json({
        news:s.news,
        raids:s.raids.map(r=>({
          id:r.id,name:r.name,date:r.date,time:r.time,status:r.status,
          allowSignups:Boolean(r.allowSignups),
          signupCount:Array.isArray(r.signups)?r.signups.length:0
        })),
        roster:s.roster.filter(x=>x.status!=="Inactive"),
        settings:s.settings
      });
    }

    if(request.method==="POST" && url.pathname==="/apply"){
      let body;
      try{ body=await request.json(); }catch{ return json({error:"Invalid application"},400); }
      const name=safeString(body.name,80);
      const className=safeString(body.className,80);
      const interest=safeString(body.interest,20);
      const discord=safeString(body.discord,100);
      const notes=safeString(body.notes,1000);
      if(!name || !VALID_CLASSES.includes(className) || !["PvE","PvP","Both"].includes(interest)){
        return json({error:"Choose a valid main class and play interest."},400);
      }
      const app={
        id:uid("app"),name,className,interest,discord,notes,
        status:"Pending",submittedAt:new Date().toISOString()
      };
      s.applications.unshift(app);
      await this.save(s);
      return json({ok:true,id:app.id},201);
    }

    if(request.method==="POST" && url.pathname==="/raid-signup"){
      let body;
      try{ body=await request.json(); }catch{ return json({error:"Invalid signup request."},400); }

      const raidId=safeString(body.raidId,120);
      const characterName=safeString(body.characterName,80);
      if(!raidId || !characterName) return json({error:"Character name is required."},400);

      const raid=s.raids.find(r=>r.id===raidId);
      if(!raid) return json({error:"Raid event not found."},404);
      if(!raid.allowSignups) return json({error:"Signups are not open for this raid."},400);

      const member=s.roster.find(r =>
        r.status!=="Inactive" &&
        safeString(r.name,80).toLowerCase()===characterName.toLowerCase()
      );

      if(!member){
        return json({error:"Please apply to Obsidian Reign before requesting to attend a Raid.",code:"NOT_ON_ROSTER"},403);
      }

      raid.signups ||= [];
      if(raid.signups.some(x=>x.memberId===member.id || safeString(x.name,80).toLowerCase()===characterName.toLowerCase())){
        return json({error:"You are already signed up for this raid.",code:"ALREADY_SIGNED"},409);
      }

      const signup={
        id:uid("signup"),
        memberId:member.id,
        name:member.name,
        role:member.role||"Member",
        className:member.className||"Unspecified",
        interest:member.interest||"Both",
        signedUpAt:new Date().toISOString()
      };
      raid.signups.push(signup);
      await this.save(s);
      return json({ok:true,message:"Raid signup confirmed.",signup},201);
    }

    if(request.method!=="POST" || url.pathname!=="/action") return json({error:"Not found"},404);

    let body;
    try{ body=await request.json(); }catch{ return json({error:"Invalid request"},400); }
    const type=safeString(body.type,30);
    const action=safeString(body.action,30);

    const collections=["news","raids","roster"];
    if(collections.includes(type)){
      const list=s[type];

      if(action==="add"){
        const item={...body.item,id:uid(type.slice(0,-1)||type)};
        if(type==="roster"){
          item.name=safeString(item.name,80);
          item.role=safeString(item.role,80)||"Member";
          item.className=VALID_CLASSES.includes(item.className)?item.className:"Templar";
          item.interest=["PvE","PvP","Both"].includes(item.interest)?item.interest:"Both";
          item.status=item.status==="Inactive"?"Inactive":"Active";
        }
        if(type==="news"){
          item.title=safeString(item.title,120);
          item.date=safeString(item.date,20);
          item.category=safeString(item.category,50);
          item.excerpt=safeString(item.excerpt,500);
        }
        if(type==="raids"){
          item.name=safeString(item.name,120);
          item.date=safeString(item.date,20);
          item.time=safeString(item.time,30);
          item.status=safeString(item.status,40);
          item.allowSignups=Boolean(item.allowSignups);
          item.signups=[];
        }
        list.push(item);
      } else {
        const i=list.findIndex(x=>x.id===body.id);
        if(i<0) return json({error:"Item not found"},404);
        if(action==="update"){
          const prior=list[i];
          list[i]={...prior,...body.item,id:prior.id};
          if(type==="raids"){
            list[i].allowSignups=Boolean(body.item?.allowSignups);
            list[i].signups=Array.isArray(prior.signups)?prior.signups:[];
          }
        } else if(action==="delete"){
          list.splice(i,1);
        } else return json({error:"Unknown action"},400);
      }
      await this.save(s);
      return json({ok:true,state:s});
    }

    if(type==="raidSignup"){
      const raid=s.raids.find(r=>r.id===body.raidId);
      if(!raid) return json({error:"Raid not found"},404);
      raid.signups ||= [];
      const i=raid.signups.findIndex(x=>x.id===body.id);
      if(i<0) return json({error:"Signup not found"},404);
      if(action==="delete"){
        raid.signups.splice(i,1);
        await this.save(s);
        return json({ok:true,state:s});
      }
      return json({error:"Unknown signup action"},400);
    }

    if(type==="settings" && action==="update"){
      s.settings={...s.settings,...body.item};
      await this.save(s);
      return json({ok:true,state:s});
    }

    if(type==="application"){
      const i=s.applications.findIndex(x=>x.id===body.id);
      if(i<0) return json({error:"Application not found"},404);
      const app=s.applications[i];

      if(action==="accept"){
        app.status="Accepted";
        app.reviewedAt=new Date().toISOString();
        const role=safeString(body.role,80)||"Member";
        const existing=s.roster.find(x=>x.name.toLowerCase()===app.name.toLowerCase());
        if(existing){
          Object.assign(existing,{role,className:app.className,interest:app.interest,status:"Active"});
        }else{
          s.roster.push({
            id:uid("member"),
            name:app.name,
            role,
            className:app.className,
            interest:app.interest,
            status:"Active"
          });
        }
      } else if(action==="deny"){
        app.status="Denied";
        app.reviewedAt=new Date().toISOString();
      } else if(action==="delete"){
        s.applications.splice(i,1);
      } else {
        return json({error:"Unknown application action"},400);
      }
      await this.save(s);
      return json({ok:true,state:s});
    }

    return json({error:"Unknown operation"},400);
  }
}

function store(env){
  const id=env.COMMAND_STORE.idFromName("obsidian-reign-global");
  return env.COMMAND_STORE.get(id);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if(url.pathname==="/api/public-data"){
      return store(env).fetch(new Request(new URL("/public",url),request));
    }

    if(url.pathname==="/api/applications" && request.method==="POST"){
      return store(env).fetch(new Request(new URL("/apply",url),request));
    }

    if(url.pathname==="/api/raid-signup" && request.method==="POST"){
      return store(env).fetch(new Request(new URL("/raid-signup",url),request));
    }

    if(url.pathname==="/api/admin/state"){
      if(!(await authorized(request))) return unauthorized();
      return store(env).fetch(new Request(new URL("/state",url),request));
    }

    if(url.pathname==="/api/admin/action"){
      if(!(await authorized(request))) return unauthorized();
      return store(env).fetch(new Request(new URL("/action",url),request));
    }

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      if (!(await authorized(request))) return unauthorized();
    }

    // Friendly extensionless public routes.
    const pageRoutes = {
      "/news": "/news.html",
      "/raids": "/raids.html",
      "/guides": "/guides.html",
      "/roster": "/roster.html",
      "/who-we-are": "/who-we-are.html",
      "/join": "/join.html"
    };
    if(request.method==="GET" && pageRoutes[url.pathname]){
      const target=new URL(request.url);
      target.pathname=pageRoutes[url.pathname];
      return env.ASSETS.fetch(new Request(target.toString(),request));
    }

    const response=await env.ASSETS.fetch(request);

    // Use the branded 404 for missing browser pages instead of a generic response.
    if(response.status===404 && request.method==="GET" && (request.headers.get("Accept")||"").includes("text/html")){
      const fallback=new URL(request.url);
      fallback.pathname="/404.html";
      const page=await env.ASSETS.fetch(new Request(fallback.toString(),request));
      return new Response(page.body,{status:404,headers:page.headers});
    }

    return response;
  }
};
