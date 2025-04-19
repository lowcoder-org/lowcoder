import { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import 'echarts-extension-gmap';
import { findIndex } from "lodash";

const googleMapsApiUrl = "https://maps.googleapis.com/maps/api/js";

function loadGoogleMapsScript(apiKey: string) {
  const mapsUrl = `${googleMapsApiUrl}?key=${apiKey}`;
  const scripts = document.getElementsByTagName('script');
  // is script already loaded
  let scriptIndex = findIndex(scripts, (script) => script.src.endsWith(mapsUrl));
  if(scriptIndex > -1) {
    return scripts[scriptIndex];
  }
  // is script loaded with diff api_key, remove the script and load again
  scriptIndex = findIndex(scripts, (script) => script.src.startsWith(googleMapsApiUrl));
  if(scriptIndex > -1) {
    scripts[scriptIndex].remove();
  }

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = mapsUrl;
  script.async = true;
  script.defer = true;
  window.document.body.appendChild(script);

  return script;
}

interface Props {
  data: Array<any>;
}

function getRandomLatLng(minLat: number, maxLat: number, minLng: number, maxLng: number) {
  const lat = Math.random() * (maxLat - minLat) + minLat
  const lng = Math.random() * (maxLng - minLng) + minLng
  return [lat, lng]
}

const UserEngagementByRegionChart = ({ data }: Props) => {
  const chartRef = useRef<any>(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);

  const isMapScriptLoaded = useMemo(() => {
    return mapScriptLoaded || (window as any)?.google;
  }, [mapScriptLoaded])
  
  const handleOnMapScriptLoad = () => {
    setMapScriptLoaded(true);
  }

  useEffect(() => {
    const gMapScript = loadGoogleMapsScript('');
    if(isMapScriptLoaded) {
      handleOnMapScriptLoad();
      return;
    }
    gMapScript.addEventListener('load', handleOnMapScriptLoad);
    return () => {
      gMapScript.removeEventListener('load', handleOnMapScriptLoad);
    }
  }, [])

  const geoPoints = useMemo(() => {
    return data.reduce((acc, log) => {
      const region = log?.geolocationDataJsonb?.city?.names?.en || 'Unknown'; // assuming `region` is added to each event
      let regionData = {
        latitude: log?.geolocationDataJsonb?.location?.latitude ?? 55,
        longitude: log?.geolocationDataJsonb?.location?.longitude ?? 15,
        count: 0,
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
    }, {} as Record<string, number>);
  }, [data]);

  const series = useMemo(() => {
    return [
      {
          "name": "Users/Region",
          "type": "scatter",
          "coordinateSystem": "gmap",
          "itemStyle": {
              "color": "#ff00ff"
          },
          "data": Object.keys(geoPoints).map(key => ({
            name: key,
            value: [
              geoPoints[key].longitude,
              geoPoints[key].latitude,
              geoPoints[key].count,
            ]
          })),
          "symbolSize": (val: number[]) => { return 8 + ((Math.log(val[2]) - Math.log(2)) / (Math.log(40) - Math.log(2))) * (40 - 8) },
          "encode": {
            "value": 2,
            "lng": 0,
            "lat": 1
          }
      }
    ]
  }, [geoPoints]);

  return (
    <>
    {isMapScriptLoaded && (
      <ReactECharts
        ref={chartRef}
        option={{
          gmap: {
            center: [15, 55],
            zoom: 3,
            renderOnMoving: true,
            echartsLayerZIndex: 2019,
            roam: true
          },
          tooltip: {
            trigger: "item",
            formatter: (params: { data: { name: string; value: any[]; }; }) => {
              return `${params.data.name}: ${params.data.value[2]}`;
            }
          },
          animation: true,
          series: series,
        }}
        style={{ height: "400px" }}
      />
    )}
    </>
  )
}

export default UserEngagementByRegionChart;