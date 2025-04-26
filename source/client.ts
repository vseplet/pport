import {
  BlinkingCursor,
  cleanPage,
  disable,
  enable,
  hideCursor,
  nicknameToColorCode,
  readKeys,
  Spinner,
  stripAnsiAndControlChars,
  TextBuffer,
  writeln,
} from "./tui.ts";
import * as colors from "jsr:@std/fmt/colors";
import { baseURL, introText, Message } from "./common.ts";

const listOfMessages: Array<Message> = [];
const indexes: { [uuid: string]: number } = {};
const buffer = new TextBuffer();
const spinner = new Spinner();
const cursor = new BlinkingCursor("█", 500);

let username = "";
let uploadMessage = false;
let inputLine = "";

const draw = async () => {
  const size = Deno.consoleSize();

  buffer.clear();

  buffer.writeln(
    `${
      colors.magenta(
        `${
          new Date().toLocaleTimeString()
        } | ${size.columns}x${size.rows} (${username})`,
      )
    } ${
      uploadMessage ? " " + spinner.frame() : colors.red("¿?")
    } ${inputLine}${cursor.getChar()}`,
  );

  for (let i = 0; i < size.rows; i++) {
    const message = listOfMessages[i];
    if (!message) continue;
    const color = nicknameToColorCode(message.username);
    buffer.writeln(
      `${colors.rgb24(message.username, color)}: ${message.text}`,
    );
  }

  await buffer.draw(true);
};

const updateMessageList = async () => {
  try {
    const body: { messages: Array<Message> } = await (await fetch(
      `${baseURL}/messages`,
      {
        method: "POST",
      },
    )).json();

    const messagesToAdd = body.messages.filter((message) => {
      if (message.uuid in indexes) return false;
      indexes[message.uuid] = listOfMessages.length - 1;
      return true;
    });

    listOfMessages.unshift(...messagesToAdd);
  } catch (e) {}
};

const input = async () => {
  for await (const key of readKeys()) {
    if (key.ctrl && key.name === "c") {
      await disable();
      Deno.exit();
    }

    if (uploadMessage) continue;

    if (key.name === "backspace" && inputLine.length > 0) {
      inputLine = inputLine.slice(0, -1);
    } else if (key.name == "enter" && inputLine.length > 0) {
      uploadMessage = true;
      const res = await fetch(`${baseURL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time: Date.now(),
          username,
          text: inputLine,
        }),
      });

      if (res.ok) inputLine = "";
      uploadMessage = false;
    } else if (
      key.name === "u" && key.ctrl && inputLine.length > 0 && !uploadMessage
    ) {
      inputLine = "";
    } else if (key.type === "char" && key.ctrl === false) {
      inputLine += key.name;
      inputLine = stripAnsiAndControlChars(inputLine);
    }
  }
};

const main = async () => {
  // сраный костль для винды
  // if (Deno.build.os === "windows" && !Deno.args[0]) {
  //   (new Deno.Command("conhost.exe", {
  //     args: ["cmd.exe", "/C", "chcp 65001 > nul && pport true"],
  //     stdin: "inherit",
  //     stdout: "inherit",
  //   })).spawn().unref();
  //   Deno.exit(0);
  // }

  await writeln(introText);
  username = prompt(`type your name:`) || "unknown";

  cleanPage();
  enable();
  await hideCursor();

  setInterval(updateMessageList, 2000);
  setInterval(draw, 50);
  await input();

  await disable();
};

await main();
