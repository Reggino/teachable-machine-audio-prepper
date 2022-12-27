import React from "react";
import JSZip from "jszip";
import FileSaver from "file-saver";

function App() {
  const onChange = React.useCallback((e: any) => {
    const reader = new FileReader();
    reader.addEventListener("load", async (event) => {
      if (!event.target?.result || typeof event.target?.result === "string") {
        throw new Error("Missing result from FileReader");
      }
      let c = new AudioContext({
        sampleRate: 44100,
      });
      let b = await c.decodeAudioData(event.target.result);
      let freqDataQueue: any = [];
      let columnTruncateLength = 232;
      let sampleRate = 44100;

      let oac = new OfflineAudioContext({
        numberOfChannels: b.numberOfChannels,
        length: b.length,
        sampleRate: sampleRate,
      });

      const source = oac.createBufferSource();
      const processor = oac.createScriptProcessor(1024, 1, 1);

      const analyser = oac.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;

      source.buffer = b;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(oac.destination);

      var freqData = new Float32Array(analyser.fftSize);
      processor.onaudioprocess = () => {
        analyser.getFloatFrequencyData(freqData);
        freqDataQueue.push(freqData.slice(0, columnTruncateLength));
      };

      source.start(0);
      oac.startRendering();

      oac.oncomplete = (e) => {
        const zip = new JSZip();
        zip.file(
          "sample.json",
          JSON.stringify([
            {
              frequencyFrames: freqDataQueue,
              blob: null,
              startTime: 0,
              endTime: b.duration,
              recordingDuration: b.duration,
              blobFilePath: "sample.webm",
            },
          ])
        );
        // zip.file(event.target.result);
        zip.generateAsync({ type: "blob" }).then((content) => {
          FileSaver.saveAs(content, "samples.zip");
        });

        source.disconnect(analyser);
        processor.disconnect(oac.destination);
      };
    });
    reader.readAsArrayBuffer(e.target.files[0]);
  }, []);

  return (
    <div className="App">
      <input type="file" id="input" multiple onChange={onChange} />
    </div>
  );
}

export default App;
