const ADMIN_USER = "admin";
const ADMIN_PASSWORD_SHA256 = "d5489258ff6090d90c49c9816b75d46240541b2a8c653daa33439364e672743f";

const VALID_CLASSES = ["Templar","Gladiator","Assassin","Ranger","Sorcerer","Spiritmaster","Cleric","Chanter"];

const DEFAULT_STATE = {
  news: [
    { id:"news-recruiting", title:"Nox Reign Is Recruiting", date:"2026-09-28", category:"Guild", excerpt:"We’re building a serious core for Aion 2 Global. Organized, social, and here for the long run." }
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

function getCookie(request,name){
  const raw=request.headers.get("Cookie")||"";
  for(const part of raw.split(";")){
    const [k,...rest]=part.trim().split("=");
    if(k===name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function cookie(name,value,{maxAge=604800,httpOnly=true,path="/"}={}){
  const parts=[name+"="+encodeURIComponent(value),"Path="+path,"SameSite=Lax","Secure"];
  if(httpOnly)parts.push("HttpOnly");
  if(Number.isFinite(maxAge))parts.push("Max-Age="+maxAge);
  return parts.join("; ");
}

function redirect(location,headers={}){
  return new Response(null,{status:302,headers:{Location:location,...headers}});
}

function discordAvatarUrl(user){
  if(!user?.id)return "";
  if(user.avatar)return "https://cdn.discordapp.com/avatars/"+user.id+"/"+user.avatar+".png?size=128";
  const index=Number((BigInt(user.id)>>22n)%6n);
  return "https://cdn.discordapp.com/embed/avatars/"+index+".png";
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
      "WWW-Authenticate": 'Basic realm="Nox Reign Legion Command", charset="UTF-8"',
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
    s.profiles ||= {};
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
      const discordId=safeString(body.discordId,40);
      if(!name || !VALID_CLASSES.includes(className) || !["PvE","PvP","Both"].includes(interest)){
        return json({error:"Choose a valid main class and play interest."},400);
      }
      const app={
        id:uid("app"),name,className,interest,discord,notes,discordId,
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
        return json({error:"Please apply to Nox Reign before requesting to attend a Raid.",code:"NOT_ON_ROSTER"},403);
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

    if(request.method==="POST" && url.pathname==="/session/create"){
      let body;
      try{body=await request.json();}catch{return json({error:"Invalid session"},400);}
      const id=safeString(body.id,120);
      const user=body.user||{};
      if(!id || !user.id)return json({error:"Invalid session"},400);
      const session={
        id,
        user:{
          id:safeString(user.id,40),
          username:safeString(user.username,80),
          globalName:safeString(user.globalName,80),
          avatar:safeString(user.avatar,200),
          avatarUrl:safeString(user.avatarUrl,500)
        },
        createdAt:Date.now(),
        expiresAt:Date.now()+7*24*60*60*1000
      };
      await this.ctx.storage.put("session:"+id,session);
      return json({ok:true});
    }

    if(request.method==="GET" && url.pathname==="/session"){
      const id=safeString(url.searchParams.get("id"),120);
      if(!id)return json({loggedIn:false});
      const session=await this.ctx.storage.get("session:"+id);
      if(!session)return json({loggedIn:false});
      if(session.expiresAt<=Date.now()){
        await this.ctx.storage.delete("session:"+id);
        return json({loggedIn:false});
      }
      return json({loggedIn:true,user:session.user});
    }

    if(request.method==="DELETE" && url.pathname==="/session"){
      const id=safeString(url.searchParams.get("id"),120);
      if(id)await this.ctx.storage.delete("session:"+id);
      return json({ok:true});
    }

    if(request.method==="GET" && url.pathname==="/profile"){
      const discordId=safeString(url.searchParams.get("discordId"),40);
      if(!discordId)return json({error:"Missing Discord ID"},400);
      const profile=s.profiles[discordId]||null;
      const member=s.roster.find(x=>x.discordId===discordId)||null;
      return json({
        profile,
        linked:Boolean(member),
        member:member?{
          id:member.id,name:member.name,role:member.role,className:member.className,
          interest:member.interest,status:member.status
        }:null
      });
    }

    if(request.method==="POST" && url.pathname==="/profile"){
      let body;
      try{body=await request.json();}catch{return json({error:"Invalid profile"},400);}
      const discordId=safeString(body.discordId,40);
      const name=safeString(body.name,80);
      const className=safeString(body.className,80);
      const interest=safeString(body.interest,20);
      if(!discordId || !name || !VALID_CLASSES.includes(className) || !["PvE","PvP","Both"].includes(interest)){
        return json({error:"Character or Community Name, a valid class, and play interest are required."},400);
      }

      const profile={
        discordId,
        name,
        className,
        interest,
        server:"Zikel",
        region:"NA East",
        updatedAt:new Date().toISOString()
      };
      s.profiles[discordId]=profile;

      const member=s.roster.find(x=>x.discordId===discordId);
      if(member){
        member.name=name;
        member.className=className;
        member.interest=interest;
        member.status=member.status||"Active";
      }

      await this.save(s);
      return json({
        ok:true,
        profile,
        linked:Boolean(member),
        member:member||null
      });
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
          item.discordId=safeString(item.discordId,40);
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
          Object.assign(existing,{
            role,
            className:app.className,
            interest:app.interest,
            status:"Active",
            discordId:app.discordId||existing.discordId||""
          });
        }else{
          s.roster.push({
            id:uid("member"),
            name:app.name,
            role,
            className:app.className,
            interest:app.interest,
            status:"Active",
            discordId:app.discordId||""
          });
        }
        if(app.discordId){
          s.profiles[app.discordId]={
            discordId:app.discordId,
            name:app.name,
            className:app.className,
            interest:app.interest,
            server:"Zikel",
            region:"NA East",
            updatedAt:new Date().toISOString()
          };
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

async function getSiteSession(request,env){
  const id=getCookie(request,"nox_session");
  if(!id)return {loggedIn:false};
  const u=new URL(request.url);
  u.pathname="/session";
  u.search="?id="+encodeURIComponent(id);
  const r=await store(env).fetch(new Request(u.toString(),{method:"GET"}));
  return r.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if(url.pathname==="/auth/discord"){
      if(!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET){
        return new Response("Discord login is not configured yet.",{status:503,headers:{"Content-Type":"text/plain; charset=UTF-8"}});
      }
      const state=crypto.randomUUID().replaceAll("-","");
      const origin=env.PUBLIC_ORIGIN||url.origin;
      const callback=origin+"/auth/discord/callback";
      const auth=new URL("https://discord.com/oauth2/authorize");
      auth.searchParams.set("response_type","code");
      auth.searchParams.set("client_id",env.DISCORD_CLIENT_ID);
      auth.searchParams.set("scope","identify");
      auth.searchParams.set("state",state);
      auth.searchParams.set("redirect_uri",callback);
      return redirect(auth.toString(),{
        "Set-Cookie":cookie("nox_oauth_state",state,{maxAge:600})
      });
    }

    if(url.pathname==="/auth/discord/callback"){
      const returnedState=url.searchParams.get("state")||"";
      const expectedState=getCookie(request,"nox_oauth_state");
      const code=url.searchParams.get("code")||"";
      if(!code || !returnedState || returnedState!==expectedState){
        return new Response("Discord login could not be verified.",{status:400,headers:{"Content-Type":"text/plain; charset=UTF-8"}});
      }

      const origin=env.PUBLIC_ORIGIN||url.origin;
      const callback=origin+"/auth/discord/callback";
      const form=new URLSearchParams({
        grant_type:"authorization_code",
        code,
        redirect_uri:callback,
        client_id:env.DISCORD_CLIENT_ID,
        client_secret:env.DISCORD_CLIENT_SECRET
      });

      const tokenRes=await fetch("https://discord.com/api/oauth2/token",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:form
      });
      if(!tokenRes.ok)return new Response("Discord token exchange failed.",{status:502});
      const token=await tokenRes.json();

      const userRes=await fetch("https://discord.com/api/v10/users/@me",{
        headers:{Authorization:"Bearer "+token.access_token}
      });
      if(!userRes.ok)return new Response("Discord profile lookup failed.",{status:502});
      const discordUser=await userRes.json();

      const sessionId=crypto.randomUUID()+crypto.randomUUID();
      const sessionUrl=new URL(request.url);
      sessionUrl.pathname="/session/create";
      const saveRes=await store(env).fetch(new Request(sessionUrl.toString(),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          id:sessionId,
          user:{
            id:discordUser.id,
            username:discordUser.username,
            globalName:discordUser.global_name||discordUser.username,
            avatar:discordUser.avatar||"",
            avatarUrl:discordAvatarUrl(discordUser)
          }
        })
      }));
      if(!saveRes.ok)return new Response("Could not create site session.",{status:500});

      const headers=new Headers({Location:"/"});
      headers.append("Set-Cookie",cookie("nox_session",sessionId,{maxAge:604800}));
      headers.append("Set-Cookie",cookie("nox_oauth_state","",{maxAge:0}));
      return new Response(null,{status:302,headers});
    }

    if(url.pathname==="/auth/me"){
      const session=await getSiteSession(request,env);
      return json(session);
    }

    if(url.pathname==="/auth/logout"){
      const id=getCookie(request,"nox_session");
      if(id){
        const sessionUrl=new URL(request.url);
        sessionUrl.pathname="/session";
        sessionUrl.search="?id="+encodeURIComponent(id);
        await store(env).fetch(new Request(sessionUrl.toString(),{method:"DELETE"}));
      }
      return redirect("/",{"Set-Cookie":cookie("nox_session","",{maxAge:0})});
    }

    if(url.pathname==="/api/public-data"){
      return store(env).fetch(new Request(new URL("/public",url),request));
    }

    if(url.pathname==="/api/applications" && request.method==="POST"){
      let body;
      try{body=await request.json();}catch{return json({error:"Invalid application"},400);}
      const session=await getSiteSession(request,env);
      if(session.loggedIn && session.user?.id){
        body.discordId=session.user.id;
        if(!body.discord)body.discord=session.user.globalName||session.user.username||"";
      }
      const applyUrl=new URL(request.url);
      applyUrl.pathname="/apply";
      return store(env).fetch(new Request(applyUrl.toString(),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      }));
    }

    if(url.pathname==="/api/profile" && request.method==="GET"){
      const session=await getSiteSession(request,env);
      if(!session.loggedIn || !session.user?.id)return json({error:"Login required"},401);
      const profileUrl=new URL(request.url);
      profileUrl.pathname="/profile";
      profileUrl.search="?discordId="+encodeURIComponent(session.user.id);
      const r=await store(env).fetch(new Request(profileUrl.toString(),{method:"GET"}));
      const data=await r.json();
      return json({...data,user:session.user});
    }

    if(url.pathname==="/api/profile" && request.method==="POST"){
      const session=await getSiteSession(request,env);
      if(!session.loggedIn || !session.user?.id)return json({error:"Login required"},401);
      let body;
      try{body=await request.json();}catch{return json({error:"Invalid profile"},400);}
      body.discordId=session.user.id;
      const profileUrl=new URL(request.url);
      profileUrl.pathname="/profile";
      return store(env).fetch(new Request(profileUrl.toString(),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      }));
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

    return env.ASSETS.fetch(request);
  }
};
