"use client";
import React, { ChangeEvent, useEffect, useRef } from "react";
import { FaPlay, FaLock, FaUnlock } from "react-icons/fa";
import { TimelineRow } from "./timelineRow";

import { MediaVideo } from "./mediaVideo";
import { TimelineVideo } from "./timelineVideo";
import {} from "react-icons/fa";
import { TimelineAudioRow } from "./timelineAudioRow";
import { TimelineAudio } from "./timelineAudio";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
export default function Home() {
  let snappingEnabled = true;
  let previewCanvas = useRef<HTMLCanvasElement>(null);
  let previewCTX: CanvasRenderingContext2D;
  let playheadDiv = useRef<HTMLDivElement>(null);
  let playheadParent = useRef<HTMLDivElement>(null);
  let zeroPointDiv = useRef<HTMLDivElement>(null);
  let zeroPointParent = useRef<HTMLDivElement>(null);
  let mediaPool = useRef<HTMLDivElement>(null);
  let timelineRowsElement = useRef<HTMLDivElement>(null);
  let timelineAudioRowsElement = useRef<HTMLDivElement>(null);
  let snappingEnabledIndicator = useRef<HTMLDivElement>(null);
  let snappingDisabledIndicator = useRef<HTMLDivElement>(null);
  let timelineDurationSlider = useRef<HTMLInputElement>(null);
  let timelineDurationInput = useRef<HTMLInputElement>(null);
  let playheadOffsetSlider = useRef<HTMLInputElement>(null);
  let propertiesUI = useRef<HTMLDivElement>(null);
  let fps = 30;
  let timelineRows: TimelineRow[] = [];
  let timelineAudioRows: TimelineAudioRow[] = [];
  let mediaVideos: MediaVideo[] = [];

  let playing = false;
  let currentTime: number;
  let previousTime: number = 0;
  let timelineTime: number = 0;
  let initalized = false;
  let timelineDuration = 50;
  let rendering = false;
  let playheadScalingOffset = 0;

  function step() {
    currentTime = performance.now();

    playheadDiv.current!.style.left =
      (
        (timelineRows[0].ui.clientWidth *
          (timelineTime + playheadScalingOffset)) /
          (timelineDuration * fps) -
        3
      ).toString() + "px";

    zeroPointDiv.current!.style.left =
      (
        (timelineRows[0].ui.clientWidth * playheadScalingOffset) /
          (timelineDuration * fps) -
        3
      ).toString() + "px";

    if (!rendering) {
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

      for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
        for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
          if (
            timelineAudioRows[i].audios[j].startPoint <= timelineTime &&
            timelineAudioRows[i].audios[j].endPoint >= timelineTime
          ) {
            if (!playing) {
              timelineAudioRows[i].audios[j].audio.pause();
              timelineAudioRows[i].audios[j].audio.currentTime = parseFloat(
                (
                  Math.floor(
                    timelineTime -
                      timelineAudioRows[i].audios[j].startPoint +
                      timelineAudioRows[i].audios[j].inPoint
                  ) / fps
                ).toFixed(3)
              );
            }
            if (playing && timelineAudioRows[i].audios[j].audio.paused) {
              timelineAudioRows[i].audios[j].audio.play();
              timelineAudioRows[i].audios[j].audio.currentTime = parseFloat(
                (
                  Math.floor(
                    timelineTime -
                      timelineAudioRows[i].audios[j].startPoint +
                      timelineAudioRows[i].audios[j].inPoint
                  ) / fps
                ).toFixed(3)
              );
            }

            if (timelineAudioRows[i].audios[j].audio.paused == true) {
              canPlay = false;
            }
          } else {
            timelineAudioRows[i].audios[j].audio.pause();
            timelineAudioRows[i].audios[j].audio.currentTime = parseFloat(
              (
                Math.floor(timelineAudioRows[i].audios[j].inPoint) / fps
              ).toFixed(3)
            );
          }
        }
      }

      if (playing && canPlay) {
        timelineTime += 1;
      }
    }
    let actualFPS = 1000 / (currentTime - previousTime);
    previousTime = currentTime;
    setTimeout(() => {
      step();
    }, (1000 / fps) * (actualFPS / fps));
  }

  async function setVideoCurrentTime(video: HTMLVideoElement, time: number) {
    await new Promise((resolve) => {
      const timeUpdateHandler = () => {
        video.removeEventListener("timeupdate", timeUpdateHandler);
        resolve(void 0);
      };
      video.addEventListener("timeupdate", timeUpdateHandler);
      video.currentTime = time;
    });
  }

  async function render() {
    let frameRate = 30;
    let lastFrame = 0;
    let canvas = previewCanvas.current!;
    let canvasWidth = canvas.width;
    let canvasHeight = canvas.height;

    previewCTX!.fillStyle = "black";
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    });
    rendering = true;
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        if (timelineRows[i].videos[j].endPoint > lastFrame) {
          lastFrame = timelineRows[i].videos[j].endPoint;
        }
      }
    }

    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        if (timelineAudioRows[i].audios[j].endPoint > lastFrame) {
          lastFrame = timelineAudioRows[i].audios[j].endPoint;
        }
      }
    }
    for (let frame = 0; frame <= lastFrame; frame++) {
      timelineTime = (frame * fps) / frameRate;
      previewCTX!.fillRect(0, 0, canvasWidth, canvasHeight);
      for (let i = timelineRows.length - 1; i >= 0; i--) {
        for (let j = 0; j < timelineRows[i].videos.length; j++) {
          if (
            timelineRows[i].videos[j].startPoint <= frame &&
            timelineRows[i].videos[j].endPoint >= frame
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
            await setVideoCurrentTime(
              timelineRows[i].videos[j].video,
              (frame -
                timelineRows[i].videos[j].startPoint +
                timelineRows[i].videos[j].inPoint) /
                frameRate
            );
            previewCTX!.drawImage(
              timelineRows[i].videos[j].video,
              timelineRows[i].videos[j].transform.x,
              timelineRows[i].videos[j].transform.y,
              timelineRows[i].videos[j].transform.width,
              timelineRows[i].videos[j].transform.height
            );
          }
          previewCTX!.setTransform(1, 0, 0, 1, 0, 0);
        }
      }

      await ffmpeg.writeFile(
        frame.toString() + ".webp",
        await fetchFile(canvas.toDataURL("image/webp"))
      );
    }
    await ffmpeg.exec(["-framerate", "30", "-i", "%d.webp", "output.mp4"]);
    console.log("FRAMES COMPILED");
    alert("FRAMES COMPILED");
    await ffmpeg.exec(["-i", "output.mp4", "-c", "copy", "input.mp4"]);
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-f",
      "lavfi",
      "-i",
      "anullsrc",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-strict",
      "experimental",
      "-shortest",
      "output.mp4",
    ]);
    console.log("STARTING AUDIO PROCESSING");
    alert("STARTING AUDIO PROCESSING");
    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        let audioElement = timelineAudioRows[i].audios[j].audio.src;
        await ffmpeg.writeFile("audioInput.mp4", await fetchFile(audioElement));
        await ffmpeg.exec([
          "-i",

          "audioInput.mp4",
          "-ss",
          secondsToHHMMSS(
            timelineAudioRows[i].audios[j].inPoint / 30
          ).toString(),
          "-t",
          secondsToHHMMSS(
            (timelineAudioRows[i].audios[j].endPoint -
              timelineAudioRows[i].audios[j].startPoint) /
              30
          ).toString(),
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-strict",
          "experimental",
          "trimmedAudio.mp4",
        ]);
        await ffmpeg.exec(["-i", "output.mp4", "-c", "copy", "input.mp4"]);

        await ffmpeg.exec([
          "-i",
          "input.mp4",
          "-i",
          "trimmedAudio.mp4",
          "-filter_complex",
          `[1:a]adelay=${
            (timelineAudioRows[i].audios[j].startPoint / 30) * 1000
          }|${
            (timelineAudioRows[i].audios[j].startPoint / 30) * 1000
          }[delayed];[delayed][0:a]amix=inputs=2[out]`,
          "-map",
          "[out]",
          "-map",
          "0:v",
          "output.mp4",
        ]);
      }
    }

    const finalOutput = await ffmpeg.readFile("output.mp4");
    const videoElement = document.createElement("video");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([finalOutput], { type: "video/mp4" })
    );
    videoElement.src = a.href;
    a.download = "merged_video.mp4";
    a.textContent = "Download merged video";
    document.body.appendChild(a);
    document.body.appendChild(videoElement);
    rendering = false;
  }
  function secondsToHHMMSS(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
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
        timelineAudioRows,
        fps,
        timelineDuration,
        parseInt(videoFPS!),
        propertiesUI.current!,
        snappingEnabled,
        playheadScalingOffset
      )
    );
  }

  function setPlayhead(value: number) {
    if (value >= 0) {
      timelineTime = value - playheadScalingOffset;

      movePlayhead();
    }
  }

  function movePlayhead() {
    playing = false;
    var rect = timelineRows[0].ui.getBoundingClientRect();
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      let tempTimelineTime =
        Math.round(
          (timelineDuration * fps * (e.clientX - rect.left)) / rect.width
        ) - playheadScalingOffset;
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

        for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
            if (
              tempTimelineTime >
                timelineAudioRows[i].audios[j].startPoint - fps &&
              tempTimelineTime < timelineAudioRows[i].audios[j].startPoint + fps
            ) {
              tempTimelineTime = timelineAudioRows[i].audios[j].startPoint;
            } else if (
              tempTimelineTime <
                timelineAudioRows[i].audios[j].endPoint + fps &&
              tempTimelineTime > timelineAudioRows[i].audios[j].endPoint - fps
            ) {
              tempTimelineTime = timelineAudioRows[i].audios[j].endPoint;
            }
          }
        }
      }
      if (tempTimelineTime >= 0) {
        timelineTime = tempTimelineTime;
      }
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

  function updateTimelineSize(event: ChangeEvent<HTMLInputElement>) {
    console.log("update", timelineDuration);
    let targetElement = event.target as HTMLInputElement;
    let playheadRect = playheadDiv.current!.getBoundingClientRect();
    let playheadContainerRect = playheadParent.current!.getBoundingClientRect();
    timelineDuration = parseFloat((event.target as HTMLInputElement).value);
    // if (timelineTime + playheadScalingOffset >= 0) {
    //   playheadScalingOffset = Math.ceil(
    //     (timelineDuration *
    //       fps *
    //       (playheadRect.left - playheadContainerRect.left)) /
    //       playheadContainerRect.width -
    //       timelineTime
    //   );
    // }

    console.log(playheadScalingOffset);

    console.log("update", timelineDuration);
    if (targetElement != timelineDurationSlider.current!) {
      timelineDurationSlider.current!.value = timelineDuration.toString();
    } else {
      timelineDurationInput.current!.value = timelineDuration.toString();
    }
    playheadOffsetSlider.current!.value = playheadScalingOffset.toString();
    updateTimelineDurations();
    updatePlayheadScalingOffsets();
    updateElementSizes();
  }

  function updatePlayheadScalingOffsets() {
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        timelineRows[i].videos[j].setPlayheadScalingOffset(
          playheadScalingOffset
        );
      }
    }

    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        timelineAudioRows[i].audios[j].setPlayheadScalingOffset(
          playheadScalingOffset
        );
      }
    }
    for (let i = mediaVideos.length - 1; i >= 0; i--) {
      mediaVideos[i].setPlayheadScalingOffset(playheadScalingOffset);
    }
  }

  function updateTimelineDurations() {
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        timelineRows[i].videos[j].setTimelineDuration(timelineDuration);
      }
    }

    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        timelineAudioRows[i].audios[j].setTimelineDuration(timelineDuration);
      }
    }
    for (let i = mediaVideos.length - 1; i >= 0; i--) {
      mediaVideos[i].setTimelineDuration(timelineDuration);
    }
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
          video.src = timelineRows[i].videos[j].video.src;
          video.muted = true;
          video.play();
          video.addEventListener("loadeddata", () => {
            timelineRows[i].addVideo(
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
                timelineAudioRows,
                i,
                fps,
                timelineDuration,
                timelineRows[i].videos[j].videoFPS,
                propertiesUI.current!,
                snappingEnabled,
                playheadScalingOffset
              )
            );
            timelineRows[i].videos[j].endPoint = timelineTime;

            timelineRows[i].videos[j].updatePreviewImage();
            video.pause();
          });
        }
      }
    }

    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        if (
          timelineAudioRows[i].audios[j].startPoint <= timelineTime &&
          timelineAudioRows[i].audios[j].endPoint >= timelineTime &&
          timelineAudioRows[i].audios[j].selected
        ) {
          let audio = document.createElement("audio");
          let blob = await fetch(timelineAudioRows[i].audios[j].audio.src).then(
            (r) => r.blob()
          );
          let newSrc = URL.createObjectURL(blob);
          audio.src = newSrc;
          audio.play();
          audio.addEventListener("loadeddata", () => {
            timelineAudioRows[i].audios.push(
              new TimelineAudio(
                timelineTime -
                  timelineAudioRows[i].audios[j].startPoint +
                  timelineAudioRows[i].audios[j].inPoint +
                  1,
                timelineTime + 1,
                timelineAudioRows[i].audios[j].endPoint,
                audio,
                timelineRows,
                timelineAudioRows,
                i,
                fps,
                timelineDuration,
                snappingEnabled,
                playheadScalingOffset
              )
            );
            timelineAudioRows[i].audios[j].endPoint = timelineTime;

            timelineAudioRows[i].audios[j].updatePreviewImage();
            audio.pause();
          });
        }
      }
    }
  }

  function updateElementSizes() {
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        timelineRows[i].videos[j].updatePreviewImage();
      }
    }

    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        timelineAudioRows[i].audios[j].updatePreviewImage();
      }
    }
  }

  function deleteElements() {
    for (let i = timelineRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineRows[i].videos.length; j++) {
        if (timelineRows[i].videos[j].selected) {
          timelineRows[i].videos[j].removeHTML();
          timelineRows[i].videos.splice(j, 1);
        }
      }
    }

    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        if (timelineAudioRows[i].audios[j].selected) {
          timelineAudioRows[i].audios[j].removeHTML();
          timelineAudioRows[i].audios.splice(j, 1);
        }
      }
    }
  }
  useEffect(() => {
    if (!initalized) {
      initalized = true;
      playheadDiv.current!.style.position = "relative";
      playheadDiv.current!.style.width = "6px";
      zeroPointDiv.current!.style.width = "6px";
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

      for (let i = 0; i < 3; i++) {
        timelineAudioRows.push(
          new TimelineAudioRow(i, timelineAudioRowsElement.current!)
        );
      }
      previousTime = performance.now() - 1000 / fps;
      step();

      document.body.addEventListener("keyup", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.code == "KeyW") {
          makeCut();
        }
        if (e.code == "KeyR") {
          render();
        }
        if (e.code == "ArrowRight") {
          timelineTime += 1;
        }
        if (e.code == "ArrowLeft") {
          timelineTime -= 1;
        }
        if (e.code == "Delete") {
          deleteElements();
        }
        if (e.code == "KeyL") {
          snappingEnabled = !snappingEnabled;
          for (let i = timelineRows.length - 1; i >= 0; i--) {
            for (let j = 0; j < timelineRows[i].videos.length; j++) {
              timelineRows[i].videos[j].setSnappingEnabled(snappingEnabled);
            }
          }

          for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
            for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
              timelineAudioRows[i].audios[j].setSnappingEnabled(
                snappingEnabled
              );
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

      window.addEventListener("resize", () => {
        updateElementSizes();
      });
    }
  }, []);

  function updatePlayheadOffset(event: ChangeEvent<HTMLInputElement>) {
    playheadScalingOffset = parseFloat(event.target.value);
    updateTimelineDurations();
    updatePlayheadScalingOffsets();
    updateElementSizes();
  }

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
            <input
              type="range"
              min="1"
              max="3600"
              step="0.01"
              defaultValue={timelineDuration}
              ref={timelineDurationSlider}
              className="ml-10"
              onChange={updateTimelineSize}
            ></input>
            <input
              type="number"
              min="1"
              max="3600"
              defaultValue={timelineDuration.toString()}
              ref={timelineDurationInput}
              className="mx-10 text-black w-10"
              onChange={updateTimelineSize}
            ></input>
            <input
              type="range"
              min="0"
              max="3600"
              step="0.01"
              defaultValue={playheadScalingOffset.toString()}
              ref={playheadOffsetSlider}
              onChange={updatePlayheadOffset}
            ></input>
          </div>
        </div>

        <div
          className="items-end text-right max-h-[50vh] border-2 border-gray-400 w-full"
          ref={propertiesUI}
        >
          <h1>Properties</h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full select-nonet">
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
          className="relative flex flex-col w-[95vw] invisible flex h-80 left-0 top-0"
          ref={zeroPointParent}
        >
          <div
            id="zeroPointDiv"
            ref={zeroPointDiv}
            className={`z-40 relative top-0 left-0 right-0 visible flex flex-col items-center mt-0 bg-white h-64 w-6`}
          ></div>
        </div>
        <div className="z-1 flex flex-col items-center absolute">
          <div
            id="timelineRows"
            ref={timelineRowsElement}
            className="z-1 relative flex flex-col items-center w-[95vw] overflow-clip"
          ></div>
          <div
            id="timelineRows"
            ref={timelineAudioRowsElement}
            className="z-1 relative flex flex-col items-center w-[95vw] overflow-clip"
          ></div>
        </div>
      </div>
    </div>
  );
}
