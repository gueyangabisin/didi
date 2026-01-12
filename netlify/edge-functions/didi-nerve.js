export default async (request, context) => {
  try {
    // Ambil KV (Edge Config)
    const store = context.edgeConfig;

    // Ambil data sensor terakhir
    const sensor = await store.get("latest_sensor");

    // Jika belum ada data sensor
    if (!sensor) {
      return new Response(
        JSON.stringify({
          context: "Saya belum bisa merasakan lingkungan karena belum ada data sensor."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse data sensor
    const data = JSON.parse(sensor);

    // Buat narasi lingkungan (INI SARAFNYA)
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
      JSON.stringify({
        context: contextText
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};
