import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

export default async function translateText(text, targetLang = "en") {
  const url = `https://translation.googleapis.com/language/translate/v2?key=AIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLAAIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLA`;

  const body = {
    q: text,
    target: targetLang,
    format: "text",
    source: "bn", // বাংলা থেকে
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (
    data &&
    data.data &&
    data.data.translations &&
    data.data.translations.length > 0
  ) {
    return data.data.translations[0].translatedText;
  } else {
    throw new Error("Translation failed");
  }
}
