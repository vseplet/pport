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
