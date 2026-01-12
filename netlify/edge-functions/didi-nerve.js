export default async (request, context) => {
  try {
    const store = context.edgeConfig;

    if (!store) {
      return new Response(
        JSON.stringify({ error: "Edge Config belum terhubung ke site" }),
        { status: 500 }
      );
    }

    const sensorRaw = await store.get("latest_sensor");

    if (!sensorRaw) {
      return new Response(
        JSON.stringify({
          context: "Saya belum bisa merasakan lingkungan karena belum ada data sensor."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(sensorRaw);

    const contextText = `
Kondisi lingkungan saat ini:
- Suhu: ${data.temp}°C
- Kelembapan: ${data.hum}%
- Intensitas gas: ${data.gas_raw}

Data terakhir diperbarui pada ${data.lastUpdate}.
Gunakan informasi ini sebagai kondisi lingkungan nyata
saat menjawab pertanyaan pengguna.
`.trim();

    return new Response(
      JSON.stringify({ context: contextText }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
};
