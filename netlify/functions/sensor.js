// ===============================
// SENSOR MEMORY (VOLATILE)
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
// INTERPRETASI SENSOR
// ===============================
function interpretSensor(data) {
  return {
    temp_state:
      data.temp < 22 ? "DINGIN" :
      data.temp <= 30 ? "NORMAL" : "PANAS",

    hum_state:
      data.hum < 40 ? "KERING" :
      data.hum <= 70 ? "NORMAL" : "LEMBAP",

    gas_state:
      data.gas_raw < 300 ? "RENDAH" :
      data.gas_raw < 600 ? "SEDANG" : "TINGGI"
  };
}

// ===============================
// NETLIFY FUNCTION HANDLER
// ===============================
export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // ===============================
  // PREFLIGHT (CORS)
  // ===============================
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {

    // ===============================
    // POST → ESP KIRIM DATA
    // ===============================
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");

      // Validasi payload
      if (
        typeof data.temp !== "number" ||
        typeof data.hum !== "number" ||
        typeof data.gas_raw !== "number"
      ) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            status: "ERROR",
            message: "Payload harus berisi temp, hum, gas_raw (number)"
          })
        };
      }

      // Interpretasi sensor
      const interpreted = interpretSensor(data);

      // Simpan ke memory (sementara)
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

    // ===============================
    // GET → DASHBOARD / AI BACA DATA
    // ===============================
    if (event.httpMethod === "GET") {

      // kalau belum ada data sama sekali
      if (!sensorMemory.updated_at) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: "NO_DATA",
            message: "Belum ada data sensor"
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sensorMemory)
      };
    }

    // ===============================
    // METHOD TIDAK DIDUKUNG
    // ===============================
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        status: "ERROR",
        message: "Method not allowed"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: "ERROR",
        message: err.message
      })
    };
  }
};
