import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

export default async function textToSpeech(text) {
  const body = {
    input: { text },
    voice: {
      languageCode: "en-US",
      ssmlGender: "NEUTRAL",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLA`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return data.audioContent;
}
