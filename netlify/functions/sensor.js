import { createClient } from "@supabase/supabase-js";

// ===============================
// SUPABASE CLIENT
// ===============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    // POST → SAVE TO DATABASE
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

      // Interpretasi
      const interpreted = interpretSensor(data);

      const payload = {
        id: 1, // <<< SELALU SATU BARIS
        temp: data.temp,
        hum: data.hum,
        gas_raw: data.gas_raw,
        temp_state: interpreted.temp_state,
        hum_state: interpreted.hum_state,
        gas_state: interpreted.gas_state,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("sensor_latest")
        .upsert(payload);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "OK",
          message: "Sensor data saved",
          data: payload
        })
      };
    }

    // ===========================
    // GET → READ FROM DATABASE
    // ===========================
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase
        .from("sensor_latest")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
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
