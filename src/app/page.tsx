"use client";
import React, { useEffect, useRef } from "react";
import { FaPlay } from "react-icons/fa";
import { TimelineRow } from "./timelineRow";

import { MediaVideo } from "./mediaVideo";
import Script from "next/script";

export default function Home() {
  let previewCanvas = useRef<HTMLCanvasElement>(null);
  let previewCTX: CanvasRenderingContext2D;
  let playhead = useRef<HTMLInputElement>(null);
  let playheadDiv = useRef<HTMLDivElement>(null);
  let mediaPool = useRef<HTMLDivElement>(null);
  let timelineRowsElement = useRef<HTMLDivElement>(null);
  let fps = 60;
  let timelineRows: TimelineRow[] = [];

  let playing = false;
  let currentTime: number;
  let previousTime: number;
  let timelineTime: number = 0;
  let initalized = false;

  function step() {
    currentTime = performance.now();
    playheadDiv.current!.style.left =
      ((timelineRows[0].ui.clientWidth * timelineTime) / 100).toString() + "px";

    previewCTX!.clearRect(
      0,
      0,
      previewCanvas.current!.width,
      previewCanvas.current!.height
    );

    if (playing) {
      timelineTime += (currentTime - previousTime) / 1000;
      playhead.current!.value = timelineTime.toString();
    }

    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        if (
          timelineRows[i].videos[j].startPoint <= timelineTime + 1 &&
          timelineRows[i].videos[j].endPoint >= timelineTime
        ) {
          let centerX =
            timelineRows[i].videos[j].transform.x +
            timelineRows[i].videos[j].transform.width / 2;
          let centerY =
            timelineRows[i].videos[j].transform.y +
            timelineRows[i].videos[j].transform.height / 2;

          previewCTX!.translate(centerX, centerY);
          previewCTX!.rotate(timelineRows[i].videos[j].transform.rotation);
          previewCTX!.translate(-centerX, -centerY);

          if (
            !playing &&
            timelineRows[i].videos[j].video.currentTime !=
              timelineTime -
                timelineRows[i].videos[j].startPoint +
                timelineRows[i].videos[j].inPoint
          ) {
            timelineRows[i].videos[j].video.currentTime =
              timelineTime -
              timelineRows[i].videos[j].startPoint +
              timelineRows[i].videos[j].inPoint;
            timelineRows[i].videos[j].video.play();
          }
          if (playing && timelineRows[i].videos[j].video.paused) {
            console.log("attempting to play");
            timelineRows[i].videos[j].video.currentTime =
              timelineTime -
              timelineRows[i].videos[j].startPoint +
              timelineRows[i].videos[j].inPoint;
            timelineRows[i].videos[j].video.play();
          }
          previewCTX!.drawImage(
            timelineRows[i].videos[j].video,
            timelineRows[i].videos[j].transform.x,
            timelineRows[i].videos[j].transform.y,
            timelineRows[i].videos[j].transform.width,
            timelineRows[i].videos[j].transform.height
          );
        } else {
          timelineRows[i].videos[j].video.pause();
        }
        previewCTX!.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    previousTime = currentTime;
    setTimeout(() => {
      step();
    }, 1000 / fps);
  }

  function importVideo(file: File) {
    let video = document.createElement("video");

    let media = URL.createObjectURL(file);
    video.src = media;
    video.width = 1600;
    video.height = 900;

    new MediaVideo(video, mediaPool.current!, timelineRows);
  }

  function updatePlayhead(e: React.ChangeEvent<HTMLInputElement>) {
    playing = false;

    timelineTime = parseFloat(e.target.value);

    playheadDiv.current!.style.left =
      ((timelineRows[0].ui.clientWidth * timelineTime) / 100).toString() + "px";
  }

  function toggleVideoPlay() {
    playing = !playing;
  }
  useEffect(() => {
    if (!initalized) {
      initalized = true;
      playheadDiv.current!.style.position = "relative";
      playheadDiv.current!.style.width = "6px";
      previewCTX = previewCanvas.current!.getContext("2d")!;
      for (let i = 0; i < 3; i++) {
        timelineRows.push(new TimelineRow(i, timelineRowsElement.current!));
      }
      step();
    }
  }, []);

  return (
    <div>
      <div className="grid grid-cols-5 gap-4 max-w-full my-5 mx-5">
        <div className="border-2 border-gray-400 items-start text-left w-full items-center overflow-y-scroll max-h-[50vh]">
          <input
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                importVideo(e.target.files[0]);
              }
            }}
            type="file"
            id="input"
            name="input_video"
            accept="video/mp4, video/mov"
            className="mx-2 my-2"
          />
          <div
            id="mediaPool"
            ref={mediaPool}
            className="px-2 grid grid-cols-2 gap-4 w-full h-full"
          ></div>
        </div>
        <div className="resize-y flex flex-col items-center justify-start max-h-[90vh] min-h-[300px] max-w-full h-min overflow-hidden col-span-3">
          <div className="flex flex-col items-center justify-start h-[50vh] max-w-full mb-5">
            <canvas
              id="previewCanvas"
              ref={previewCanvas}
              width="1600"
              height="900"
              className="border-2 border-gray-400 w-min max-h-full max-w-full"
            ></canvas>
          </div>
          <button onClick={toggleVideoPlay}>
            <FaPlay className="" style={{ color: "#6a84f4" }} size={20} />
          </button>
        </div>

        <div className="items-end text-right max-h-[50vh] border-2 border-gray-400 w-full">
          <h1>Properties</h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full select-none">
        <div className="relative flex flex-col w-[95vw] bg-white h-5 my-5">
          <input
            onChange={updatePlayhead}
            id="playhead"
            type="range"
            defaultValue="1"
            min="0"
            max="100"
            step="0.01"
            className="absolute w-[100vw] bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            ref={playhead}
          ></input>

          <div
            id="playheadDiv"
            ref={playheadDiv}
            className={`relative top-0 left-0 right-0 bottom-0 flex flex-col items-center bg-slate-800 w-6 py-2 my-auto`}
          ></div>
        </div>

        <div
          id="timelineRows"
          ref={timelineRowsElement}
          className="flex flex-col items-center w-[95vw]"
        ></div>
        <div className="flex flex-col items-center w-[95vw]">
          <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
            Audio Row 1
          </div>
          <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
            Audio Row 2
          </div>
          <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
            Audio Row 3
          </div>
        </div>
      </div>
      <Script></Script>
    </div>
  );
}
