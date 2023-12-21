"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaLock, FaUnlock } from "react-icons/fa";
import { TimelineRow } from "./timelineRow";
import TransformUI from "./components/transformUI";

import { MediaVideo } from "./mediaVideo";
import Script from "next/script";
import { TimelineVideo } from "./timelineVideo";
import {} from "react-icons/fa";
export default function Home() {
  let snappingEnabled = true;
  let previewCanvas = useRef<HTMLCanvasElement>(null);
  let previewCTX: CanvasRenderingContext2D;
  let playheadDiv = useRef<HTMLDivElement>(null);
  let playheadParent = useRef<HTMLDivElement>(null);
  let mediaPool = useRef<HTMLDivElement>(null);
  let timelineRowsElement = useRef<HTMLDivElement>(null);
  let snappingEnabledIndicator = useRef<HTMLDivElement>(null);
  let snappingDisabledIndicator = useRef<HTMLDivElement>(null);
  let propertiesUI = useRef<HTMLDivElement>(null);
  let fps = 30;
  let timelineRows: TimelineRow[] = [];
  let mediaVideos: MediaVideo[] = [];

  let playing = false;
  let currentTime: number;
  let previousTime: number = 0;
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
          console.log(timelineRows[i].videos[j].video.currentTime * 30);
          console.log(timelineTime - timelineRows[i].videos[j].startPoint);

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
            timelineRows[i].videos[j].video.play();
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
          timelineRows[i].videos[j].video.pause();
          timelineRows[i].videos[j].video.currentTime = parseFloat(
            (Math.floor(timelineRows[i].videos[j].inPoint) / fps).toFixed(3)
          );
        }
        previewCTX!.setTransform(1, 0, 0, 1, 0, 0);
      }
    }

    if (playing && canPlay) {
      timelineTime += 1; //(currentTime - previousTime) / fps;
    }
    let actualFPS = 1000 / (currentTime - previousTime);
    previousTime = currentTime;
    setTimeout(() => {
      step(); //requestAnimationFrame(step);
    }, (1000 / fps) * (actualFPS / fps));
  }

  function importVideo(file: File) {
    let video = document.createElement("video");

    let media = URL.createObjectURL(file);
    video.src = media;

    let videoFPS = window.prompt("Input the FPS of the video", "60");
    mediaVideos.push(
      new MediaVideo(
        video,
        mediaPool.current!,
        timelineRows,
        fps,
        timelineDuration,
        parseInt(videoFPS!),
        propertiesUI.current!,
        snappingEnabled
      )
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
      let tempTimelineTime = Math.round(
        (timelineDuration * fps * (e.clientX - rect.left)) / rect.width
      );
      if (snappingEnabled && !playing) {
        for (let i = timelineRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < timelineRows[i].videos.length; j++) {
            if (
              tempTimelineTime > timelineRows[i].videos[j].startPoint - fps &&
              tempTimelineTime < timelineRows[i].videos[j].startPoint + fps
            ) {
              tempTimelineTime = timelineRows[i].videos[j].startPoint;
            } else if (
              tempTimelineTime < timelineRows[i].videos[j].endPoint + fps &&
              tempTimelineTime > timelineRows[i].videos[j].endPoint - fps
            ) {
              tempTimelineTime = timelineRows[i].videos[j].endPoint;
            }
          }
        }
      }

      timelineTime = tempTimelineTime;
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
                  timelineRows[i].videos[j].inPoint +
                  timelineRows[i].videos[j].videoFPS / fps,
                timelineTime + 1,
                timelineRows[i].videos[j].endPoint,
                video,
                timelineRows[i].videos[j].transform,
                timelineRows,
                i,
                fps,
                timelineDuration,
                timelineRows[i].videos[j].videoFPS,
                propertiesUI.current!,
                snappingEnabled
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
      previousTime = performance.now() - 1000 / fps;
      step();

      document.body.addEventListener("keyup", (e) => {
        e.preventDefault();
        e.stopPropagation();
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
          snappingEnabled = !snappingEnabled;
          for (let i = timelineRows.length - 1; i >= 0; i--) {
            for (let j = 0; j < timelineRows[i].videos.length; j++) {
              timelineRows[i].videos[j].setSnappingEnabled(snappingEnabled);
            }
          }
          for (let i = mediaVideos.length - 1; i >= 0; i--) {
            mediaVideos[i].setSnappingEnabled(snappingEnabled);
          }
          if (snappingEnabled) {
            snappingEnabledIndicator.current!.classList.remove("hidden");
            snappingDisabledIndicator.current!.classList.add("hidden");
          } else {
            snappingEnabledIndicator.current!.classList.add("hidden");
            snappingDisabledIndicator.current!.classList.remove("hidden");
          }
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
              <FaPlay style={{ color: "#6a84f4" }} size={20} />
            </button>
            <div>
              <div ref={snappingEnabledIndicator}>
                <FaLock className="absolute"></FaLock>
              </div>
              <div ref={snappingDisabledIndicator} className="hidden">
                <FaUnlock className="absolute"></FaUnlock>
              </div>
            </div>
          </div>
        </div>

        <div
          className="items-end text-right max-h-[50vh] border-2 border-gray-400 w-full"
          ref={propertiesUI}
        >
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
