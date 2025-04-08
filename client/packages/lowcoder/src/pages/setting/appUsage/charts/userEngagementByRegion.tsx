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

  const series = useMemo(() => {
    return [
      {
          "name": "Company Size",
          "type": "scatter",
          "coordinateSystem": "gmap",
          "itemStyle": {
              "color": "#ff00ff"
          },
          "data": data
            // .filter(item => {
            //   if (!item.geolocationDataJsonb) return false;
            //   return item.geolocationDataJsonb.longitude !== null && 
            //   item.geolocationDataJsonb.latitude !== null
            // })
            .map(item => ({
              name: item.details?.applicationName,
              value: [
                ...getRandomLatLng(35, 72, 25, 65),
                1,
              ]
              // value: [
              //   geoLocation.location.longitude, // item.longitude,
              //   geoLocation.location.latitude, // item.latitude,
              //   1
              // ]
            }))
          ,
          "encode": {
            "value": 2,
            "lng": 0,
            "lat": 1
          }
      }
    ]
  }, [data]);

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
            formatter: "{b}"
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