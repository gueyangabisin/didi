// ===============================
// SENSOR MEMORY (SHORT-TERM)
// ===============================
let sensorMemory = {
  temp: null,
  hum: null,
  gas_raw: null,
  temp_state: null,
  hum_state: null,
  gas_state: null,
  updated_at: null
};

// ===============================
// INTERPRETASI SENSOR (SYARAF)
// ===============================
function interpretSensor(data) {
  const result = {};

  // --- SUHU ---
  if (data.temp < 22) result.temp_state = "DINGIN";
  else if (data.temp <= 30) result.temp_state = "NORMAL";
  else result.temp_state = "PANAS";

  // --- KELEMBAPAN ---
  if (data.hum < 40) result.hum_state = "KERING";
  else if (data.hum <= 70) result.hum_state = "NORMAL";
  else result.hum_state = "LEMBAP";

  // --- GAS (RAW) ---
  if (data.gas_raw < 300) result.gas_state = "RENDAH";
  else if (data.gas_raw < 600) result.gas_state = "SEDANG";
  else result.gas_state = "TINGGI";

  return result;
}

// ===============================
// NETLIFY HANDLER
// ===============================
export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    // ===========================
    // POST → UPDATE MEMORY
    // ===========================
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      if (
        data.temp === undefined ||
        data.hum === undefined ||
        data.gas_raw === undefined
      ) {
        throw new Error("Data wajib: temp, hum, gas_raw");
      }

      // Interpretasi (syaraf sensorik)
      const interpreted = interpretSensor(data);

      // Simpan ke memori
      sensorMemory = {
        temp: data.temp,
        hum: data.hum,
        gas_raw: data.gas_raw,
        ...interpreted,
        updated_at: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "OK",
          message: "Sensor data updated",
          data: sensorMemory
        })
      };
    }

    // ===========================
    // GET → READ MEMORY
    // ===========================
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sensorMemory)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };

  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        status: "Error",
        message: error.message
      })
    };
  }
};
