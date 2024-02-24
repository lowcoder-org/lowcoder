import React from 'react';
import PropTypes from 'prop-types'
import { fromUnevaledValue,fromValue } from "lowcoder-core";
import { Runtime, Inspector } from '@observablehq/runtime';

//The real BPMN packages
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import Modeler from 'bpmn-js/lib/Modeler';
import Viewer from 'bpmn-js/lib/Viewer';
import { prototype } from 'react-grid-layout';

function Bpmn(props) {
  const [bpmnRef, setBpmnRef] = React.useState();
  const  bpmnId = Math.random().toString(16).slice(2)

    //Create a element from html string
  function fromHTML(html, trim = true) {
      // Process the HTML string.
      html = trim ? html : html.trim();
      if (!html) return null;
    
      // Then set up a new template element.
      const template = document.createElement('template');
      template.innerHTML = html;
      const result = template.content.children;
    
      // Then return either an HTMLElement or HTMLCollection,
      // based on whether the input HTML had one or more roots.
      if (result.length === 1) return result[0];
      return result;
  } 

  //Download as SVG
  function downloadSvg(svgCanvas,filename){
      var svgEl = svgCanvas.getElementsByTagName('svg')[1]
      var svgData = svgEl.outerHTML;
      var preface = '<?xml version="1.0" standalone="no"?>\r\n';
      var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
  }

  //The function we trigger when we want to download
  function downloadBPMNImage(e){
    if (props.svgDownload) {
       const filename = props.imageName ? props.imageName  : "bpmn"
       const svgCanvas = document.getElementById('BPMN_' + bpmnId)
       downloadSvg(svgCanvas,filename +  ".svg")
    }
    e.preventDefault()
  }

  const useBpmnRef = React.useCallback(ref => {
    setBpmnRef(ref);
  }, []);
  
  const [runtime] = React.useState(() => new Runtime());

  React.useEffect(() => {
    if (bpmnRef && !props.skipRedraw()) {
      // Rebuild the BPMN
      bpmnRef.innerHTML = '<div id="BPMN_'+bpmnId+'" style="position:absolute;' +
       (props.designer ? 'top:0px;left:0px' : 'top:-35px;left:-145px') + ';bottom:0;right:0;"></div>'
    
      const config = {container: '#BPMN_' + bpmnId,  
        keyboard: {
          bindTo: window
        }
      }
      //Choose between designer of modeler
      const bpmn = props.designer ? new Modeler(config) : new Viewer(config);

      var xmlStr = props.xml
      if (!xmlStr) {
        xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
              <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                id="Definitions_`+bpmnId+`" 
                targetNamespace="http://bpmn.io/schema/bpmn" 
                exporter="bpmn-js" 
                exporterVersion="17.0.2">
                <bpmn:process id="Process_`+bpmnId+`" isExecutable="false" />
                <bpmndi:BPMNDiagram id="BPMNDiagram_1">
                <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process`+bpmnId+`" />
                </bpmndi:BPMNDiagram>
              </bpmn:definitions>`
      }
      //When we are not a designer and have values evaluate them
      if (props.values && !props.designer){
        xmlStr = fromUnevaledValue(xmlStr)
            .evaluate(Object.assign({}, ...Object.entries(props.values).map(([k, v]) => ({[k]: fromValue(v)})))) 
      }
      //Attach the XML
      bpmn.importXML(xmlStr);
      //Find the canvas we are using   
      const bpmnCanvas = document.getElementById("BPMN_"+bpmnId) 
    
      if (props.designer) {
        bpmn.on('commandStack.changed', async (e) => {
          var { xml } =  await bpmn.saveXML({ format: true });
          props.onDataChange(xml);
        })
      //} else {
        //TODO: Fix issue with viewport.
        //https://forum.bpmn.io/t/scale-viewer-s-to-match-canvas-size/4491/5
        // bpmn.zoom('fit-viewport');  //
      }

      //Should we hide the BPMN Logo
      if (!props.showLogo) {
        bpmnCanvas.getElementsByClassName('bjs-powered-by')[0].style="display:none" 
      }
      //Should we enable downloading add a download svg
      if (props.svgDownload) {
        //Add to download icon to diff
        bpmnCanvas.getElementsByClassName('djs-parent')[0].append(fromHTML(`<a id="Click_`+bpmnId+`" target="_blank" class="bjs-powered-by" style="color: rgb(224, 224, 224); position: absolute; right: 8px; top: `+(props.designer ? 10 : 45)+`px; z-index: 100;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 25" width="20" height="20" style="vertical-align: middle;color: ">
    <path fill="#C0C0C0" d="M22.71,6.29a1,1,0,0,0-1.42,0L20,7.59V2a1,1,0,0,0-2,0V7.59l-1.29-1.3a1,1,0,0,0-1.42,1.42l3,3a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l3-3A1,1,0,0,0,22.71,6.29ZM19,13a1,1,0,0,0-1,1v.38L16.52,12.9a2.79,2.79,0,0,0-3.93,0l-.7.7L9.41,11.12a2.85,2.85,0,0,0-3.93,0L4,12.6V7A1,1,0,0,1,5,6h8a1,1,0,0,0,0-2H5A3,3,0,0,0,2,7V19a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V14A1,1,0,0,0,19,13ZM5,20a1,1,0,0,1-1-1V15.43l2.9-2.9a.79.79,0,0,1,1.09,0l3.17,3.17,0,0L15.46,20Zm13-1a.89.89,0,0,1-.18.53L13.31,15l.7-.7a.77.77,0,0,1,1.1,0L18,17.21Z"/>
    </svg>
    </a>`))
        var dLink = document.getElementById("Click_"+bpmnId) 
        dLink.onclick =downloadBPMNImage
      }
    }
  }, [bpmnRef, props.xml,props.values,props.svgDownload,
               props.imageName,props.designer,props.showLogo,props.onDataChange]);

  return (
    <div
      ref={useBpmnRef}
      style={{ height: '100%', width: '100%' , position: 'relative' }}
    ></div>
  );
}


Bpmn.propTypes = {
  xml: PropTypes.string,
  values: PropTypes.object,
  svgDownload : PropTypes.bool,
  imageName : PropTypes.string,
  designer : PropTypes.bool,
  showLogo : PropTypes.bool,
  onDataChange: PropTypes.func,
  skipRedraw: PropTypes.func,
}

export default Bpmn;
