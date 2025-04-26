import { home, Message, psScript, shScript } from "./common.ts";
import { stripAnsiAndControlChars } from "./tui.ts";

const messages: Array<Message> = [];
const channel = new BroadcastChannel("all_messages");

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
    return new Response(shScript);
  } else if (userAgent?.includes("PowerShell")) {
    return new Response(psScript);
  } else if (userAgent?.includes("Deno") && method == "GET") {
    return new Response(await Deno.readFile(`./source${path}`));
  } else if (method == "GET" && path == "/") {
    return new Response(home, {
      headers: {
        "Context-Type": "text/html",
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
