import React from "react";
import JSZip from "jszip";
import FileSaver from "file-saver";
import promiseMapSeries from "./inc/promiseMapSeries";

function App() {
  const [progress, setProgress] = React.useState<{
    finished: number;
    selected: number;
  }>();
  const [error, setError] = React.useState<string>();

  const onChange = React.useCallback(async (e: any) => {
    const zip = new JSZip();
    setProgress({ selected: e.target.files.length, finished: 0 });
    promiseMapSeries(e.target.files, (file: File) => {
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", async (event) => {
          if (
            !event.target?.result ||
            typeof event.target?.result === "string"
          ) {
            throw new Error("Missing result from FileReader");
          }
          let c = new AudioContext({
            sampleRate: 44100,
          });
          let b: AudioBuffer;
          try {
            b = await c.decodeAudioData(event.target.result);
          } catch (e) {
            reject(e);
            return;
          }
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
          zip.file(file.name, file);

          oac.oncomplete = () => {
            source.disconnect(analyser);
            processor.disconnect(oac.destination);
            setProgress((progress) =>
              progress
                ? {
                    ...progress,
                    finished: progress.finished + 1,
                  }
                : progress
            );
            resolve({
              blob: null,
              blobFilePath: file.name,
              endTime: b.duration,
              frequencyFrames: freqDataQueue,
              recordingDuration: b.duration,
              startTime: 0,
            });
          };
        });
        reader.readAsArrayBuffer(file);
      });
    })
      .then((sample) => {
        zip.file("samples.json", JSON.stringify(sample));
        zip.generateAsync({ type: "blob" }).then((content) => {
          FileSaver.saveAs(content, "samples.zip");
        });
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  const progressPercentage = progress
    ? `${Math.round((progress.finished / progress.selected) * 100)}%`
    : null;

  if (error) {
    return <h1 style={{ color: "red" }}>{error}</h1>;
  }

  return (
    <div className="App">
      {progressPercentage ? (
        <div style={{ border: "1px solid black" }}>
          <div
            style={{
              backgroundColor: "grey",
              height: 20,
              width: progressPercentage,
              textAlign: "center",
            }}
          >
            {progressPercentage}
          </div>
        </div>
      ) : (
        <>
          Please select .webm audio files
          <input
            type="file"
            id="input"
            multiple
            onChange={onChange}
            accept="audio/webm"
          />
        </>
      )}
    </div>
  );
}

export default App;
