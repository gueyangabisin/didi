import { handler as sensorsHandler } from "./sensors.js";
import fetch from "node-fetch"; // pastikan node 18+ atau install node-fetch

const XIAOZHI_KB_ENDPOINT = "https://xiaozhi.ai/api/knowledge"; // ganti sesuai endpoint asli
const XIAOZHI_API_TOKEN = "<TOKEN_XIAOZHI>"; // ganti dengan token kamu

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // Ambil data sensor terakhir
    const sensorsRes = await sensorsHandler({ httpMethod: "GET" });
    const sensorsData = JSON.parse(sensorsRes.body);

    if (sensorsData.status === "NO_DATA") {
      return { statusCode: 200, headers, body: JSON.stringify({ status: "NO_DATA", content: "Belum ada data sensor." }) };
    }

    const content = `Kondisi lingkungan saat ini:
- Suhu: ${sensorsData.temp}°C (${sensorsData.temp_state})
- Kelembapan: ${sensorsData.hum}% (${sensorsData.hum_state})
- Intensitas gas: ${sensorsData.gas_raw} (${sensorsData.gas_state})
Terakhir diperbarui: ${sensorsData.updated_at}`;

    // === Push ke XiaoZhi Knowledge Base ===
    const xzRes = await fetch(XIAOZHI_KB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjc2MzY2MiwiYWdlbnRJZCI6MTMzMzM3MCwiZW5kcG9pbnRJZCI6ImFnZW50XzEzMzMzNzAiLCJwdXJwb3NlIjoibWNwLWVuZHBvaW50IiwiaWF0IjoxNzY4MjU4NTA3LCJleHAiOjE3OTk4MTYxMDd9.kR8A3g4tHdWc_tf12Y5YpeMlz4nYdAoClPV3mrUtWjrkpKgouY39A_iut4ZJfwkgy2BUrSMf5lqeq5tJvwI-YA}`
      },
      body: JSON.stringify({ content })
    });

    const result = await xzRes.json();

    return { statusCode: 200, headers, body: JSON.stringify({ status: "OK", content, xiaozhiResult: result }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ status: "ERROR", message: err.message }) };
  }
};
