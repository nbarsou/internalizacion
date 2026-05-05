import { getUniversities } from '../../queries';
import { UniversityMapLoader } from './university-map-loader';

export async function DashboardMap() {
  const rawData = await getUniversities();

  const mapPoints = rawData.map((u) => ({
    id: u.id,
    name: u.name,
    lat: u.coordinates.lat,
    lng: u.coordinates.lng,
    info: `${u.city}, ${u.country}`,
  }));

  return (
    <div className="space-y-2">
      <UniversityMapLoader data={mapPoints} />
    </div>
  );
}
