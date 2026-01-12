import { handler as sensorsHandler } from "./sensors.js";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    // Panggil sensors.js handler langsung untuk dapat data terakhir
    const sensorsRes = await sensorsHandler({ httpMethod: "GET" });
    const sensorsData = JSON.parse(sensorsRes.body);

    if (sensorsData.status === "NO_DATA") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "NO_DATA",
          content: "Belum ada data sensor."
        })
      };
    }

    // Format content untuk XiaoZhi
    const content = `Kondisi lingkungan saat ini:
- Suhu: ${sensorsData.temp}°C (${sensorsData.temp_state})
- Kelembapan: ${sensorsData.hum}% (${sensorsData.hum_state})
- Intensitas gas: ${sensorsData.gas_raw} (${sensorsData.gas_state})
Terakhir diperbarui: ${sensorsData.updated_at}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "OK", content })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: "ERROR", message: err.message })
    };
  }
};
