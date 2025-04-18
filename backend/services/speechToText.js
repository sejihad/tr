import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

export default async function speechToText(audioBuffer) {
  const audioBytes = audioBuffer.toString("base64");

  const body = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "bn-BD",
    },
    audio: {
      content: audioBytes,
    },
  };

  const res = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=AIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLA`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!data.results || data.results.length === 0) return "";
  return data.results.map((r) => r.alternatives[0].transcript).join("\n");
}
