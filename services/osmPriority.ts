export async function checkHighPriorityOSM(
  lat: number,
  lng: number
): Promise<boolean> {
  const radius = 100; // meters

  const query = `
    [out:json];
    (
      node["amenity"~"school|hospital"](around:${radius},${lat},${lng});
      way["amenity"~"school|hospital"](around:${radius},${lat},${lng});
      relation["amenity"~"school|hospital"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  const res = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      body: query,
    }
  );

  const data = await res.json();

  return data.elements && data.elements.length > 0;
}
