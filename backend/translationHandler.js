const fetch = require("node-fetch");
const fs = require("fs");

const API_KEY = "AIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLA";

// 🧠 1. Speech-to-Text (Bangla)
async function speechToText(audioBuffer) {
  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`;

  const audioBytes = audioBuffer.toString("base64");

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: "bn-BD",
      },
      audio: { content: audioBytes },
    }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  const transcript = data?.results?.[0]?.alternatives?.[0]?.transcript;
  return transcript || null;
}

// 🌍 2. Translate Bangla → English
async function translateText(text) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      q: text,
      source: "bn",
      target: "en",
      format: "text",
    }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  return data?.data?.translations?.[0]?.translatedText || null;
}

// 🔊 3. Text-to-Speech (English)
async function textToSpeech(text) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "LINEAR16" },
    }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  const audioContent = data?.audioContent;
  return audioContent ? Buffer.from(audioContent, "base64") : null;
}

// 🔁 Main Handler
async function handleTranslateStream(audioBuffer) {
  try {
    const transcript = await speechToText(audioBuffer);
    if (!transcript) return null;

    const translatedText = await translateText(transcript);
    if (!translatedText) return null;

    const audioOutput = await textToSpeech(translatedText);
    return audioOutput;
  } catch (err) {
    console.error("Translation Error:", err);
    return null;
  }
}

module.exports = { handleTranslateStream };
