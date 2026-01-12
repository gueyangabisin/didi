let sensorMemory = {
  temp: null,
  hum: null,
  gas_raw: null,
  temp_state: null,
  hum_state: null,
  gas_state: null,
  updated_at: null
};

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

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");

      if (
        typeof data.temp !== "number" ||
        typeof data.hum !== "number" ||
        typeof data.gas_raw !== "number"
      ) {
        throw new Error("Payload invalid");
      }

      const interpreted = interpretSensor(data);

      sensorMemory = {
        ...data,
        ...interpreted,
        updated_at: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "OK",
          received: sensorMemory
        })
      };
    }

    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(sensorMemory)
      };
    }

    return { statusCode: 405, headers };

  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
