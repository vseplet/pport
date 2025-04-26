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
export const home = async () => `
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
    </style>
  </head>
  <body>
    <pre>

      ${
        introText.replace(
          /https?:\/\/[^\s]+/g,
          (url) => `<a href="${url}">${url}</a>`,
        )
      }
                      <span style="color: orange">Total installs: ${(await kv.get(["installs"])).value}</span>

      Install / Update

        Unix-like:

        $ curl -fsSL ${domain} | sh

        Windows:

        $ irm ${domain} | iex

      Run

        $ pport

      View installation script

        Unix-like:

        $ curl -sL ${domain}

        Windows:

        $ irm ${domain}

      <code style="color: rgb(0 251 255)">
      Last messages:

${messages.map(msg => {
  return `        ${msg.username}: ${msg.text}\n`
}).join('')}
      </code>
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
