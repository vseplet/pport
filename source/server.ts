import {
  domain,
  introText,
  kv,
  Message,
  psScript,
  shScript,
} from "./common.ts";
import { stripAnsiAndControlChars } from "./tui.ts";

const messages: Array<Message> = [];
const channel = new BroadcastChannel("all_messages");

// deno-fmt-ignore
export const home = async () => {
  const stars = await getGitHubStars();
  return `
<html>
  <head>
    <title>PPORT</title>
    <style>
      * {
        background:rgb(0, 68, 74);
        color: white;
        font-family: monospace;
      }

      pre {
        font-size: 14px;
        line-height: 1.4;
        white-space: pre;
      }

      .header {
        color: rgb(0 251 255)
      }

      .sh {
        color: #00ff54
      }

      .stars {
        color: rgb(255 236 0);
      }

      .stars a {
        position: relative;
      }

      .stars a:hover::after {
        content: "Star this project on GitHub! 🌟";
        position: absolute;
        left: 0;
        top: 100%;
        background: #fff;
        color: #000;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 16px;
        white-space: nowrap;
        z-index: 1;
      }
    </style>
  </head>
  <body>
    <pre>
      <span class="header">${
        introText.replace(
          /https?:\/\/[^\s]+/g,
          (url) => `<a href="${url}">${url}</a>`,
        )
      }</span>
      <span style="color: orange">🚀 Total installs: ${(await kv.get(["installs"])).value}</span>

      <span class="stars"><a href="https://github.com/vseplet/pport" style="color: rgb(255 236 0);">⭐ GitHub Stars:</a>   ${stars}</span>

      <span class="header">Install / Update</span>

        Unix-like: <span class="sh">curl -fsSL ${domain} | sh</span>
        Windows:   <span class="sh">irm ${domain} | iex</span>

      <span class="header">Run</span>          <span class="sh">pport</span>

      <span class="header">View installation script</span>

        Unix-like: <span class="sh">curl -sL ${domain}</span>
        Windows:   <span class="sh">irm ${domain}</span>

      <span class="header">Last messages</span>
      <code>${messages.map(msg => {
  return `        ${msg.username}: ${msg.text}\n`
}).join('') || '        ...'}</code>
    </pre>

    <script type="text/javascript" >
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

      ym(101415234, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true
      });
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/101415234" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  </body>
</html>
`;
};

const getGitHubStars = async (): Promise<string> => {
  try {
    const response = await fetch(`https://api.github.com/repos/vseplet/pport`);
    if (!response.ok) {
      return "N/A";
    }
    const data = await response.json();
    return data.stargazers_count.toString();
  } catch (e) {
    console.error("Failed to fetch GitHub stars:", e);
    return "N/A";
  }
};

const updateInstallsCount = async () => {
  try {
    if ((await kv.get<number>(["installs"])).value === null) {
      await kv.set(["installs"], new Deno.KvU64(1n));
      return;
    }

    await kv.atomic()
      .mutate({
        type: "sum",
        key: ["installs"],
        value: new Deno.KvU64(1n),
      })
      .commit();
  } catch (e) {
    console.log(e);
  }
};

const requestHandler = async (req: Request) => {
  const userAgent = req.headers.get("User-Agent");
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  if (path == "/send" && method == "POST") {
    const body = await req.json();
    const message: Message = { uuid: crypto.randomUUID(), ...body };
    message.text = stripAnsiAndControlChars(message.text);
    messages.unshift(message);
    channel.postMessage(message);
    console.log(`add message ${message.text} ${message.uuid}`);
    return new Response("send");
  } else if (path == "/messages" && method == "POST") {
    return new Response(
      JSON.stringify({ messages: messages.slice(0, 10) }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
  if (userAgent?.includes("curl")) {
    await updateInstallsCount();
    return new Response(shScript);
  } else if (userAgent?.includes("PowerShell")) {
    await updateInstallsCount();
    return new Response(psScript);
  } else if (userAgent?.includes("Deno") && method == "GET") {
    return new Response(await Deno.readFile(`./source${path}`));
  } else if (method == "GET" && path == "/") {
    return new Response(await home(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } else {
    return new Response("unknown");
  }
};

const messageHandler = (event: MessageEvent<Message>) => {
  console.log(`take message from channel: ${event.data.uuid}`);
  messages.unshift(event.data);
};

const main = () => {
  channel.onmessage = messageHandler;
  Deno.serve(requestHandler);
};

main();
