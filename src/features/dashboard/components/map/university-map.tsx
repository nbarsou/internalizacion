'use client';

import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from '@/components/ui/map';
import { Building2, MapPin } from 'lucide-react';
import type { MapPoint } from './university-map-skeleton';

export type { MapPoint };

interface UniversityMapProps {
  data: MapPoint[];
}

export default function UniversityMap({ data }: UniversityMapProps) {
  return (
    <div
      className="bg-muted relative z-0 w-full overflow-hidden rounded-xl border shadow-sm"
      style={{ height: '420px' }}
    >
      <Map className="h-full w-full" viewport={{ center: [0, 20], zoom: 2 }}>
        <MapControls
          position="bottom-right"
          showZoom={true}
          showCompass={false}
          showFullscreen={false}
        />

        {data.map((item) => (
          <MapMarker key={item.id} latitude={item.lat} longitude={item.lng}>
            <MarkerContent />
            <MarkerPopup>
              <div className="flex flex-col gap-1 px-1 py-0.5">
                <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                  <Building2 className="text-primary h-3 w-3" />
                  {item.name}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" />
                  {item.info}
                </span>
              </div>
            </MarkerPopup>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
