import { useMemo, useState, useCallback } from "react";
import { Map, Marker, Overlay, Bounds } from 'pigeon-maps';
import Supercluster, { PointFeature } from 'supercluster';
import styled from 'styled-components';

function getClusterSize(count: number): number {
  // Logarithmic scaling for better visualization of large numbers
  const minSize = 30;
  const maxSize = 60;
  const scale = Math.log10(count + 1);
  return Math.min(maxSize, Math.max(minSize, minSize + (scale * 10)));
}

function getClusterColor(count: number): string {
  if (count > 1000) return '#d32f2f'; // red for very high density
  if (count > 500) return '#f57c00'; // orange for high density
  if (count > 100) return '#f9a825'; // yellow for medium density
  return '#1976d2';                  // blue for low density
}

interface ClusterProperties {
  id: string;
  count: number;
  cluster: boolean;
  point_count_abbreviated?: string;
}

interface GeoPoint {
  latitude: number;
  longitude: number;
  count: number;
  id: string;
}

interface TooltipState {
  lat: number;
  lng: number;
  text: string;
}

interface Props {
  data: Array<any>;
}

const ClusterMarker = styled.div<{ size: number; color: string }>`
  background: ${props => props.color};
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: ${props => props.size / 3}px;
  border: 2px solid white;
  box-shadow: 0 0 6px rgba(0,0,0,0.3);
  cursor: pointer;
  pointer-events: auto;
  opacity: 0.5;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const TooltipContainer = styled.div`
  background: white;
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  pointer-events: none;
  transform: translateY(-120px);
  white-space: nowrap;
`;

const MapContainer = styled.div`
  height: 400px;
  width: 100%;
  position: relative;
`;

const UserEngagementByRegionChart = ({ data }: Props) => {
  const [zoom, setZoom] = useState(3);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const geoPoints = useMemo(() => {
    return data.reduce((acc, log) => {
      const region = log?.geolocationDataJsonb?.city?.names?.en || 'Unknown'; // assuming `region` is added to each event
      let regionData: GeoPoint = {
        latitude: log?.geolocationDataJsonb?.location?.latitude ?? 55,
        longitude: log?.geolocationDataJsonb?.location?.longitude ?? 15,
        count: 0,
        id: region,
      };
      if (acc[region]) {
        acc[region] = {
          ...acc[region],
          count: acc[region].count + 1,
        }
      } else {
        acc[region] = regionData;
      }
      return acc;
    }, {} as Record<string, GeoPoint>);
  }, [data]);

  const cluster = useMemo(() => {
    const sc = new Supercluster<ClusterProperties>({
      radius: 300,
      maxZoom: 20,
    });

    const geojsonPoints: PointFeature<ClusterProperties>[] = (Object.values(geoPoints) as GeoPoint[]).map(({ id, latitude, longitude, count }) => ({
      type: 'Feature',
      properties: { id, count, cluster: true },
      geometry: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    }));

    sc.load(geojsonPoints);
    return sc;
  }, [geoPoints]);

  const clusters = useMemo(() => {
    if (!bounds?.ne || !bounds?.sw) return [];
  
    const westLng = bounds.sw[1];
    const southLat = bounds.sw[0];
    const eastLng = bounds.ne[1];
    const northLat = bounds.ne[0];
  
    return cluster.getClusters([westLng, southLat, eastLng, northLat], zoom);
  }, [cluster, bounds, zoom]);

  const handleBoundsChanged = useCallback(({ zoom, bounds }: { zoom: number; bounds: Bounds }) => {
    setZoom(zoom);
    setBounds(bounds);
  }, []);

  const handleMarkerMouseOver = useCallback((lat: number, lng: number, id: string, count: number) => {
    setTooltip({ lat, lng, text: `${id}: ${count}` });
  }, []);

  const handleMarkerMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <MapContainer>
      <Map
        height={400}
        defaultCenter={[55, 15]}
        defaultZoom={5}
        onBoundsChanged={handleBoundsChanged}
      >
        {clusters.map((c, i) => {
          const [lng, lat] = c.geometry.coordinates;
          const isCluster = !!c.properties.cluster;
          
          if (isCluster) {
            const count = c.properties.count;
            const size = getClusterSize(count);
            const color = getClusterColor(count);
            return (
              <Marker
                key={`cluster-${i}`}
                anchor={[lat, lng]}
              >
                <ClusterMarker
                  size={size}
                  color={color}
                  onMouseEnter={() => handleMarkerMouseOver(lat, lng, c.properties.id, c.properties.count)}
                  onMouseLeave={handleMarkerMouseLeave}
                >
                  {c.properties.point_count_abbreviated}
                </ClusterMarker>
              </Marker>
            );
          }

          return (
            <Marker
              key={`marker-${i}`}
              anchor={[lat, lng]}
              onMouseOver={() => handleMarkerMouseOver(lat, lng, c.properties.id, c.properties.count)}
              onMouseOut={handleMarkerMouseLeave}
            />
          );
        })}
        
        {tooltip && (
          <Overlay anchor={[tooltip.lat, tooltip.lng]} offset={[0, -40]}>
            <TooltipContainer>
              {tooltip.text}
            </TooltipContainer>
          </Overlay>
        )}
      </Map>
    </MapContainer>
  );
};

export default UserEngagementByRegionChart;