// Campus boundary for ITS (Institut Teknologi Sepuluh Nopember), Surabaya.
// Used both to draw the boundary on maps and to price/validate bookings.
export const ITS_CENTER: [number, number] = [-7.2756, 112.7985]

// Campus boundary polygon as [lat, lng] pairs (converted from GeoJSON [lng, lat]).
export const ITS_GEOFENCE: [number, number][] = [
  [-7.289957, 112.789679],
  [-7.290287, 112.791846],
  [-7.290404, 112.792436],
  [-7.29,     112.796438],
  [-7.289542, 112.796652],
  [-7.289457, 112.797393],
  [-7.287105, 112.797961],
  [-7.287427, 112.799592],
  [-7.285429, 112.800027],
  [-7.283476, 112.80103],
  [-7.283232, 112.801003],
  [-7.282774, 112.801266],
  [-7.281752, 112.801389],
  [-7.280582, 112.801394],
  [-7.279762, 112.800783],
  [-7.274792, 112.799431],
  [-7.274867, 112.797543],
  [-7.27642,  112.790676],
  [-7.276814, 112.790279],
  [-7.278602, 112.790473],
  [-7.279134, 112.791191],
  [-7.279932, 112.790462],
  [-7.280475, 112.790687],
  [-7.289691, 112.789539],
]

// Ray-casting / even-odd rule point-in-polygon test.
export function isInsideGeofence(point: { lat: number; lng: number }): boolean {
  let inside = false
  for (let i = 0, j = ITS_GEOFENCE.length - 1; i < ITS_GEOFENCE.length; j = i++) {
    const [latI, lngI] = ITS_GEOFENCE[i]
    const [latJ, lngJ] = ITS_GEOFENCE[j]
    const intersects = ((lngI > point.lng) !== (lngJ > point.lng)) &&
      (point.lat < (latJ - latI) * (point.lng - lngI) / (lngJ - lngI) + latI)
    if (intersects) inside = !inside
  }
  return inside
}
