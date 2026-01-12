// Variabel sementara (akan reset jika server idle)
let sensorData = { temp: 0, hum: 0, gas: 0, lastUpdate: "Belum ada data" };

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handling untuk browser pre-flight request
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    // JALUR POST (Update Data dari ESP32 atau Simulasi)
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      
      // Validasi Data
      if (data.temp === undefined || data.hum === undefined) {
        throw new Error("Format data salah! Harus ada temp dan hum.");
      }

      global.sensorData = {
        temp: parseFloat(data.temp),
        hum: parseFloat(data.hum),
        gas: data.gas || 0,
        lastUpdate: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
      };

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ status: "Success", message: "Data terupdate!", data: global.sensorData }) 
      };
    }

    // JALUR GET (Ambil Data untuk DeepSeek/Dashboard)
    if (event.httpMethod === "GET") {
      const currentData = global.sensorData || sensorData;
      return { statusCode: 200, headers, body: JSON.stringify(currentData) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

  } catch (error) {
    return { 
      statusCode: 400, 
      headers, 
      body: JSON.stringify({ status: "Error", message: error.message }) 
    };
  }
};