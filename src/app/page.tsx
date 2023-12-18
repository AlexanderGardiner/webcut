"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaLock, FaUnlock } from "react-icons/fa";
import { TimelineRow } from "./timelineRow";

import { MediaVideo } from "./mediaVideo";
import Script from "next/script";
import { TimelineVideo } from "./timelineVideo";
import {} from "react-icons/fa";
export default function Home() {
  let [snappingEnabled, setSnapping] = useState(false);
  let previewCanvas = useRef<HTMLCanvasElement>(null);
  let previewCTX: CanvasRenderingContext2D;
  let playheadDiv = useRef<HTMLDivElement>(null);
  let playheadParent = useRef<HTMLDivElement>(null);
  let mediaPool = useRef<HTMLDivElement>(null);
  let timelineRowsElement = useRef<HTMLDivElement>(null);
  let fps = 60;
  let timelineRows: TimelineRow[] = [];

  let playing = false;
  let currentTime: number;
  let previousTime: number;
  let timelineTime: number = 0;
  let initalized = false;
  let timelineDuration = 50;

  function step() {
    currentTime = performance.now();
    playheadDiv.current!.style.left =
      (
        (timelineRows[0].ui.clientWidth * timelineTime) /
          (timelineDuration * fps) -
        3
      ).toString() + "px";
    let canPlay = true;
    previewCTX!.clearRect(
      0,
      0,
      previewCanvas.current!.width,
      previewCanvas.current!.height
    );

    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        if (
          timelineRows[i].videos[j].startPoint <= timelineTime &&
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

          if (!playing) {
            timelineRows[i].videos[j].video.pause();
            timelineRows[i].videos[j].video.currentTime = parseFloat(
              (
                Math.floor(
                  timelineTime -
                    timelineRows[i].videos[j].startPoint +
                    timelineRows[i].videos[j].inPoint
                ) / fps
              ).toFixed(3)
            );
          }
          if (playing && timelineRows[i].videos[j].video.paused) {
            timelineRows[i].videos[j].video.currentTime = parseFloat(
              (
                Math.floor(
                  timelineTime -
                    timelineRows[i].videos[j].startPoint +
                    timelineRows[i].videos[j].inPoint
                ) / fps
              ).toFixed(3)
            );

            timelineRows[i].videos[j].video.play();
          }
          previewCTX!.drawImage(
            timelineRows[i].videos[j].video,
            timelineRows[i].videos[j].transform.x,
            timelineRows[i].videos[j].transform.y,
            timelineRows[i].videos[j].transform.width,
            timelineRows[i].videos[j].transform.height
          );
          if (timelineRows[i].videos[j].video.paused == true) {
            canPlay = false;
          }
        } else {
          if (
            timelineTime <
            timelineRows[i].videos[j].startPoint +
              fps / timelineRows[i].videos[j].videoFPS
          ) {
            timelineRows[i].videos[j].video.currentTime = parseFloat(
              (timelineRows[i].videos[j].inPoint / fps).toFixed(3)
            );
          } else if (
            timelineTime >
            timelineRows[i].videos[j].endPoint -
              fps / timelineRows[i].videos[j].videoFPS
          ) {
            timelineRows[i].videos[j].video.currentTime = parseFloat(
              (
                (timelineRows[i].videos[j].inPoint +
                  (timelineRows[i].videos[j].endPoint -
                    timelineRows[i].videos[j].startPoint)) /
                fps
              ).toFixed(3)
            );
          }
        }
        previewCTX!.setTransform(1, 0, 0, 1, 0, 0);
      }
    }

    if (playing && canPlay) {
      timelineTime += 1;
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
    let videoFPS = window.prompt("Input the FPS of the video", "60");
    new MediaVideo(
      video,
      mediaPool.current!,
      timelineRows,
      fps,
      timelineDuration,
      parseInt(videoFPS!)
    );
  }

  function setPlayhead(value: number) {
    timelineTime = value;

    movePlayhead();
  }

  function movePlayhead() {
    playing = false;
    var rect = timelineRows[0].ui.getBoundingClientRect();
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      timelineTime = Math.round(
        (timelineDuration * fps * (e.clientX - rect.left)) / rect.width
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.body.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseup", handleMouseUp);
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }

  function toggleVideoPlay() {
    playing = !playing;
  }

  async function makeCut() {
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        if (
          timelineRows[i].videos[j].startPoint <= timelineTime &&
          timelineRows[i].videos[j].endPoint >= timelineTime &&
          timelineRows[i].videos[j].selected
        ) {
          let video = document.createElement("video");
          let blob = await fetch(timelineRows[i].videos[j].video.src).then(
            (r) => r.blob()
          );
          let newSrc = URL.createObjectURL(blob);
          video.src = newSrc;
          video.play();

          video.addEventListener("loadeddata", () => {
            timelineRows[i].videos.push(
              new TimelineVideo(
                timelineTime -
                  timelineRows[i].videos[j].startPoint +
                  timelineRows[i].videos[j].inPoint,
                timelineTime + 1,
                timelineRows[i].videos[j].endPoint,
                video,
                timelineRows[i].videos[j].transform,
                timelineRows[i],
                fps,
                timelineDuration,
                timelineRows[i].videos[j].videoFPS
              )
            );
            timelineRows[i].videos[j].endPoint = timelineTime;

            timelineRows[i].videos[j].updatePreviewImage();
            video.pause();
          });
        }
      }
    }
  }

  function deleteVideo() {
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        if (timelineRows[i].videos[j].selected) {
          timelineRows[i].videos[j].removeHTML();
          timelineRows[i].videos.splice(j, 1);
        }
      }
    }
  }
  useEffect(() => {
    if (!initalized) {
      initalized = true;
      playheadDiv.current!.style.position = "relative";
      playheadDiv.current!.style.width = "6px";
      previewCTX = previewCanvas.current!.getContext("2d")!;
      // playheadDiv.current!.addEventListener("mousedown", (e) => {
      //   e.preventDefault();
      //   movePlayhead();
      // });

      playheadParent.current!.addEventListener("mousedown", (e) => {
        e.preventDefault();
        var rect = timelineRows[0].ui.getBoundingClientRect();
        setPlayhead(
          Math.round(
            (timelineDuration * fps * (e.clientX - rect.left)) / rect.width
          )
        );
      });
      for (let i = 0; i < 3; i++) {
        timelineRows.push(new TimelineRow(i, timelineRowsElement.current!));
      }
      step();

      document.body.addEventListener("keyup", (e) => {
        if (e.code == "KeyW") {
          makeCut();
        }
        if (e.code == "ArrowRight") {
          timelineTime += 1;
        }
        if (e.code == "ArrowLeft") {
          timelineTime -= 1;
        }
        if (e.code == "Delete") {
          deleteVideo();
        }
        if (e.code == "KeyL") {
          setSnapping((current) => {
            snappingEnabled = !current;
            return snappingEnabled;
          });
        }
      });
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
          <div className="flex flex-row">
            <button onClick={toggleVideoPlay} className="px-5">
              <FaPlay className="" style={{ color: "#6a84f4" }} size={20} />
            </button>
            <FaLock className={snappingEnabled ? "" : "hidden"}></FaLock>
            <FaUnlock className={snappingEnabled ? "hidden" : ""}></FaUnlock>
          </div>
        </div>

        <div className="items-end text-right max-h-[50vh] border-2 border-gray-400 w-full">
          <h1>Properties</h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full select-none">
        <div
          className="relative flex flex-col w-[95vw] bg-white h-5 my-5"
          ref={playheadParent}
        >
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
    </div>
  );
}
