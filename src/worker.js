const ADMIN_USER = "admin";
const ADMIN_PASSWORD_SHA256 = "d5489258ff6090d90c49c9816b75d46240541b2a8c653daa33439364e672743f";

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
    if (username !== ADMIN_USER) return false;

    return (await sha256Hex(password)) === ADMIN_PASSWORD_SHA256;
  } catch {
    return false;
  }
}

function unauthorized() {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Legion Command Locked | Obsidian Reign</title>
<style>
html,body{height:100%;margin:0;background:#020204;color:#eeeae4;font-family:Arial,sans-serif}
main{height:100%;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:
radial-gradient(circle at 50% 30%,rgba(111,56,217,.16),transparent 35%),#020204}
section{max-width:560px;text-align:center;border:1px solid rgba(184,151,79,.28);padding:38px;background:rgba(7,7,11,.94);box-shadow:0 30px 90px rgba(0,0,0,.55)}
h1{font-family:Georgia,serif;letter-spacing:.08em;color:#ead59a;margin:0 0 12px}
p{color:#9d969f;line-height:1.7}
small{color:#766f79}
</style>
</head>
<body>
<main><section><h1>LEGION COMMAND LOCKED</h1><p>Authentication is required to enter the Obsidian Reign command console.</p><small>Your browser will ask for command credentials.</small></section></main>
</body>
</html>`,
    {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "WWW-Authenticate": 'Basic realm="Obsidian Reign Legion Command", charset="UTF-8"',
        "Cache-Control": "no-store"
      }
    }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      if (!(await authorized(request))) return unauthorized();
    }

    return env.ASSETS.fetch(request);
  }
};
