// Constants
export const kv = await Deno.openKv();

export const baseURL = Deno.permissions.querySync &&
    Deno.permissions.querySync({ name: "env" }).state === "granted"
  ? Deno.env.get(`BASE_URL`) || "https://localhost:8000"
  : `https://pport.top`;

export const domain = baseURL.split("//")[1];

export const introText = `
                   ____  ____   ___  ____ _____
                  |  _ \\|  _ \\ / _ \\|  _ \\_   _|
                  | |_) | |_) | | | | |_) || |
                  |  __/|  __/| |_| |  _ < | |
                  |_|   |_|    \\___/|_| \\_\\|_|

      📜 Text-based Messenger for the Command Line

      Created by Vsevolod Pletnev
      https://linkedin.com/in/sevapp

      Source Code:
      https://github.com/vseplet/PPORT

      Specially crafted for Hacker News ❤️
      https://news.ycombinator.com/item?id=43805189
`;

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

export const installCommand =
  `deno install -g -f -r --unstable-kv --allow-net=${
    baseURL.split("//")[1]
  } ${baseURL}/client.ts -n pport`;

export const shScript = `
if ! command -v deno &> /dev/null
then
    echo "Deno is not installed. Proceeding with installation..."
    curl -fsSL https://deno.land/install.sh | sh
else
    echo "Deno is already installed."
fi

${installCommand}
`;

export const psScript = `
if (Get-Command deno -ErrorAction SilentlyContinue) {
  Write-Host "Deno is already installed."
} else {
  Write-Host "Deno is not installed. Proceeding with installation..."
  Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://deno.land/install.ps1'))
}

${installCommand}
`;

// Types
export type Message = {
  username: string;
  uuid: string;
  text: string;
  time: number;
};
