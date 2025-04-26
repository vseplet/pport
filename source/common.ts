// Constants
export const baseURL =
  Deno.permissions.querySync({ name: "env" }).state === "granted"
    ? Deno.env.get(`BASE_URL`) || "https://localhost:8000"
    : `https://pport.top`;

export const introText = `
  ____  ____   ___  ____ _____
  |  _ \\|  _ \\ / _ \\|  _ \\_   _|
  | |_) | |_) | | | | |_) || |
  |  __/|  __/| |_| |  _ < | |
  |_|   |_|    \\___/|_| \\_\\|_|

  Text-based messenger for the command line
  Created by @vseplet (https://github.com/vseplet/PPORT)
`;

export const home = `
${introText}

  Install/Update
    unix-like: curl -fsSL pport.top | sh
    windows: irm pport.top | iex

  And run
    pport
`;

export const installCommand = `deno install -g -f -r --allow-net=${
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
