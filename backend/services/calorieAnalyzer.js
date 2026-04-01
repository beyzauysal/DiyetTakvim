const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = "gpt-4o-mini";

function extractJsonObject(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function analyzeMealWithAI({ mealType, note, imageUrl }) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY tanımlı değil (.env).");
  }

  const model = (process.env.OPENAI_MEAL_MODEL || DEFAULT_MODEL).trim();

  const systemPrompt = `Sen bir diyetisyen asistanısın. Kullanıcının öğün açıklamasını ve varsa fotoğrafını analiz edip YALNIZCA geçerli JSON döndür. Ek metin yazma.
Şema: {"foods": string[], "totalCalories": number}
foods: Türkçe yiyecek isimleri. totalCalories: yaklaşık toplam kcal (tam sayı veya ondalık).`;

  const userLines = [
    `Öğün tipi: ${mealType || "belirtilmedi"}`,
    `Açıklama: ${(note || "").trim() || "yok"}`,
    "Yukarıdaki bilgi ve varsa görselle tahmini besin listesi ve toplam kaloriyi JSON olarak ver.",
  ];
  const userText = userLines.join("\n");

  const content = [{ type: "text", text: userText }];

  if (imageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: imageUrl },
    });
  }

  const basePayload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
    max_tokens: 600,
    temperature: 0.35,
  };

  let response;
  try {
    response = await client.chat.completions.create({
      ...basePayload,
      response_format: { type: "json_object" },
    });
  } catch (firstErr) {
    const msg = String(firstErr?.message || "");
    if (/response_format|json_object|not support|unsupported/i.test(msg)) {
      response = await client.chat.completions.create(basePayload);
    } else {
      const status = firstErr?.status;
      throw new Error(
        status
          ? `OpenAI hata (${status}): ${msg}`
          : `OpenAI isteği başarısız: ${msg}`
      );
    }
  }

  const rawText = response.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(rawText);

  if (!parsed) {
    throw new Error(
      `AI yanıtı işlenemedi. Ham çıktı: ${rawText.slice(0, 200)}${rawText.length > 200 ? "…" : ""}`
    );
  }

  const foods = Array.isArray(parsed.foods)
    ? parsed.foods.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const totalCalories = Number(parsed.totalCalories);

  if (!foods.length || Number.isNaN(totalCalories) || totalCalories < 0) {
    throw new Error("AI geçerli foods / totalCalories döndürmedi.");
  }

  return {
    foods,
    totalCalories: Math.round(totalCalories),
  };
}

module.exports = {
  analyzeMealWithAI,
};
