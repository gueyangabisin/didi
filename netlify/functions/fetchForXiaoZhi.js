import { handler as sensorsHandler } from "./sensors.js";
import fetch from "node-fetch"; // pastikan node 18+ atau sudah ada fetch global

const XIAOZHI_WS = "wss://api.xiaozhi.me/mcp/?token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjc2MzY2MiwiYWdlbnRJZCI6MTMzMzM3MCwiZW5kcG9pbnRJZCI6ImFnZW50XzEzMzMzNzAiLCJwdXJwb3NlIjoibWNwLWVuZHBvaW50IiwiaWF0IjoxNzY4MjU4NTA3LCJleHAiOjE3OTk4MTYxMDd9.kR8A3g4tHdWc_tf12Y5YpeMlz4nYdAoClPV3mrUtWjrkpKgouY39A_iut4ZJfwkgy2BUrSMf5lqeq5tJvwI-YA";

export const scheduled = async (event) => {
  try {
    // Ambil data sensor terbaru
    const sensorsRes = await sensorsHandler({ httpMethod: "GET" });
    const sensorsData = JSON.parse(sensorsRes.body);

    if (sensorsData.status === "NO_DATA") {
      console.log("Belum ada data sensor.");
      return;
    }

    const content = `Kondisi lingkungan saat ini:
- Suhu: ${sensorsData.temp}°C (${sensorsData.temp_state})
- Kelembapan: ${sensorsData.hum}% (${sensorsData.hum_state})
- Intensitas gas: ${sensorsData.gas_raw} (${sensorsData.gas_state})
Terakhir diperbarui: ${sensorsData.updated_at}`;

    // ===== Push ke XiaoZhi via WebSocket =====
    // Kita harus connect ke WSS endpoint karena XiaoZhi sekarang pakai WebSocket
    // Bisa pakai 'ws' module
    const WebSocket = (await import("ws")).default;
    const ws = new WebSocket(XIAOZHI_WS);

    ws.on("open", () => {
      ws.send(JSON.stringify({ content }));
      ws.close();
      console.log("Data berhasil dikirim ke XiaoZhi");
    });

    ws.on("error", (err) => {
      console.error("Error mengirim ke XiaoZhi:", err);
    });

  } catch (err) {
    console.error("Scheduled function error:", err);
  }
};
