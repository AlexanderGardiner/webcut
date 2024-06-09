"use client";
import React, { ChangeEvent, useEffect, useRef } from "react";
import { FaPlay, FaLock, FaUnlock, FaTimes } from "react-icons/fa";
import { TimelineRow } from "./timelineComponents/timelineRow";

import { MediaVideo } from "./timelineComponents/mediaVideo";
import { TimelineElement } from "./timelineComponents/timelineElement";
import { TimelineVideo } from "./timelineComponents/timelineVideo";
import {} from "react-icons/fa";
import { TimelineAudioRow } from "./timelineComponents/timelineAudioRow";
import { TimelineAudio } from "./timelineComponents/timelineAudio";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Transform } from "./timelineComponents/transform";
import { SpeedAdjustment } from "./timelineComponents/speedAdjustment";
import { downloadZip } from "client-zip";

export default function Editor() {
  // Setup references
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
  let mediaFileInput = useRef<HTMLInputElement>(null);
  let propertiesUI = useRef<HTMLDivElement>(null);
  let renderLog = useRef<HTMLTextAreaElement>(null);
  let renderLogContainer = useRef<HTMLDivElement>(null);
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

  // Moves the playhead one step
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

      // Updates the position of all of the videos
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
                  (timelineRows[i].videos[j].video.playbackRate *
                    Math.floor(
                      timelineTime -
                        timelineRows[i].videos[j].startPoint +
                        timelineRows[i].videos[j].inPoint
                    )) /
                  fps
                ).toFixed(3)
              );
            }
            if (playing && timelineRows[i].videos[j].video.paused) {
              timelineRows[i].videos[j].video.play();
              timelineRows[i].videos[j].video.currentTime = parseFloat(
                (
                  (timelineRows[i].videos[j].video.playbackRate *
                    Math.floor(
                      timelineTime -
                        timelineRows[i].videos[j].startPoint +
                        timelineRows[i].videos[j].inPoint
                    )) /
                  fps
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

      // Updates the position of all of the audios
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

    // Sets fps compensation
    let actualFPS = 1000 / (currentTime - previousTime);
    previousTime = currentTime;
    setTimeout(() => {
      step();
    }, (1000 / fps) * (actualFPS / fps));
  }

  // Sets the time of the video
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

  // Logs the rendering data
  async function logRenderData(data: string) {
    console.log("\n" + data + "\n");
    renderLog.current!.innerHTML = renderLog.current!.innerHTML + data + "\n\n";
  }

  // Renders the video using FFmpeg
  async function render() {
    renderLogContainer.current!.classList.remove("hidden");
    renderLogContainer.current!.classList.add("visible");
    logRenderData("Starting Rendering");
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

    // Gets the length of the video
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

    logRenderData("Video length determined");

    // Draws frames and compiles them to a video
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
              (timelineRows[i].videos[j].video.playbackRate *
                (frame -
                  timelineRows[i].videos[j].startPoint +
                  timelineRows[i].videos[j].inPoint)) /
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
      logRenderData("Loaded frame " + frame + " to canvas");
    }
    logRenderData("All Frames put to canvas");
    logRenderData("Compiling frames to mp4");
    await ffmpeg.exec(["-framerate", "30", "-i", "%d.webp", "output.mp4"]);
    logRenderData("Compiled frames to mp4");
    await ffmpeg.exec(["-i", "output.mp4", "-c", "copy", "input.mp4"]);

    // Adds the audio to the video
    logRenderData("Adding blank audio to mp4 for further audio processing");
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
    logRenderData("Added blank audio to mp4 for further audio processing");
    for (let i = timelineAudioRows.length - 1; i >= 0; i--) {
      for (let j = 0; j < timelineAudioRows[i].audios.length; j++) {
        logRenderData(
          "Starting audio processing on audio " + j + " on row " + i
        );
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
        logRenderData("Trimmed audio " + j + " on row " + i);
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
        logRenderData("Combined audio " + j + " on row " + i + " with mp4");
      }
    }

    // Exports the video
    const finalOutput = await ffmpeg.readFile("output.mp4");
    logRenderData("Render Complete");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([finalOutput], { type: "video/mp4" })
    );
    link.download = "Export.mp4";
    link.click();
    link.remove();
  }

  // Converts seconds to hours, minutes and seconds
  function secondsToHHMMSS(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  // Imports a video
  function importVideo(file: File, videoFPS: number) {
    let video = document.createElement("video");

    let media = URL.createObjectURL(file);
    video.src = media;

    mediaVideos.push(
      new MediaVideo(
        video,
        mediaPool.current!,
        timelineRows,
        timelineAudioRows,
        fps,
        timelineDuration,
        videoFPS,
        propertiesUI.current!,
        snappingEnabled,
        playheadScalingOffset
      )
    );
  }

  // Moves the playhead
  function setPlayhead(value: number) {
    if (value >= 0) {
      timelineTime = value - playheadScalingOffset;

      movePlayhead();
    }
  }

  // Moves the playhead
  function movePlayhead() {
    playing = false;
    var rect = timelineRows[0].ui.getBoundingClientRect();
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      let tempTimelineTime =
        Math.round(
          (timelineDuration * fps * (e.clientX - rect.left)) / rect.width
        ) - playheadScalingOffset;
      // Snaps the playhead
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

  // Play the timeline
  function toggleVideoPlay() {
    playing = !playing;
  }

  // Adjust the scale of the timeline
  function updateTimelineSize(event: ChangeEvent<HTMLInputElement>) {
    let targetElement = event.target as HTMLInputElement;
    timelineDuration = parseFloat((event.target as HTMLInputElement).value);

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

  // Update the offset for the playhead
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

  // Update the length of the timelines
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

  // Cuts an element at the playhead
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
                timelineRows[i].videos[j].speedAdjustment,
                timelineRows,
                timelineAudioRows,
                i,
                fps,
                timelineDuration,
                video.duration,
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
                audio.duration,
                propertiesUI.current!,
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

  // Updates the sizes of elements
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

  // Delete elements
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

  // Exports the current project
  async function exportProject() {
    let mediaToDownload = [];
    for (let i = 0; i < mediaVideos.length; i++) {}
    let projectJSON: {
      projectName: string;
      timelineRows: {
        inPoint: number;
        startPoint: number;
        endPoint: number;
      }[][];
      timelineAudioRows: any[][];
    } = {
      projectName: "testing",
      timelineRows: [[], [], []],
      timelineAudioRows: [[], [], []],
    };

    // Saves a json format
    for (let i = 0; i < timelineRows.length; i++) {
      let videos = timelineRows[i].videos;
      for (let j = 0; j < videos.length; j++) {
        let response = await fetch(timelineRows[i].videos[j].video.src);
        let blob = await response.blob();
        mediaToDownload.push(
          new File([blob], "timelineVideo" + i + ".mp4", { type: blob.type })
        );
        let videoObject = {
          inPoint: videos[j].inPoint,
          startPoint: videos[j].startPoint,
          endPoint: videos[j].endPoint,
          sourceFile: "timelineVideo" + i + ".mp4",
          transform: videos[j].transform,
          speedAdjustment: videos[j].speedAdjustment,
          videoFPS: videos[j].videoFPS,
          maxDuration: videos[j].maxDuration,
        };
        projectJSON.timelineRows[i].push(videoObject);
      }
    }

    for (let i = 0; i < timelineAudioRows.length; i++) {
      let audios = timelineAudioRows[i].audios;
      for (let j = 0; j < audios.length; j++) {
        let response = await fetch(timelineAudioRows[i].audios[j].audio.src);
        let blob = await response.blob();
        mediaToDownload.push(
          new File([blob], "timelineAudio" + i + ".mp3", { type: blob.type })
        );
        let audioObject = {
          inPoint: audios[j].inPoint,
          startPoint: audios[j].startPoint,
          endPoint: audios[j].endPoint,
          sourceFile: "timelineAudio" + i + ".mp3",
          maxDuration: audios[j].maxDuration,
        };
        projectJSON.timelineAudioRows[i].push(audioObject);
      }
    }
    mediaToDownload.push({
      name: "project.json",
      input: JSON.stringify(projectJSON),
    });

    // Downloads a zip
    const zip = await downloadZip(mediaToDownload).blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(zip);
    link.download = "project.zip";
    link.click();
    link.remove();
  }

  // Loads a project
  async function loadProject(files: FileList) {
    let fileReader = new FileReader();

    // Parses the json
    fileReader.onload = () => {
      if (typeof fileReader.result === "string") {
        const data = JSON.parse(fileReader.result);
        let projectTimelineRows = data.timelineRows;
        let projectTimelineAudioRows = data.timelineAudioRows;
        for (let i = 0; i < projectTimelineRows.length; i++) {
          let projectTimelineRow = projectTimelineRows[i];
          for (let j = 0; j < projectTimelineRow.length; j++) {
            let video = document.createElement("video");
            for (let k = 0; k < files.length; k++) {
              if (projectTimelineRow[j].sourceFile == files[k].name) {
                importVideo(files[k], projectTimelineRow[j].videoFPS);
                video.src = mediaVideos[mediaVideos.length - 1].video.src;
              }
            }
            video.muted = true;
            video.addEventListener("loadeddata", () => {
              timelineRows[i].addVideo(
                new TimelineVideo(
                  projectTimelineRow[j].inPoint,
                  projectTimelineRow[j].startPoint,
                  projectTimelineRow[j].endPoint,
                  video,
                  new Transform(
                    projectTimelineRow[j].transform.x,
                    projectTimelineRow[j].transform.y,
                    projectTimelineRow[j].transform.width,
                    projectTimelineRow[j].transform.height,
                    projectTimelineRow[j].transform.rotation
                  ),
                  new SpeedAdjustment(
                    projectTimelineRow[j].speedAdjustment.speed,
                    video
                  ),
                  timelineRows,
                  timelineAudioRows,
                  i,
                  fps,
                  timelineDuration,
                  projectTimelineRow[j].maxDuration,
                  projectTimelineRow[j].videoFPS,
                  propertiesUI.current!,
                  snappingEnabled,
                  playheadScalingOffset
                )
              );
              video.pause();
            });
            video.play();
          }
        }

        for (let i = 0; i < projectTimelineAudioRows.length; i++) {
          let projectTimelineAudioRow = projectTimelineAudioRows[i];
          for (let j = 0; j < projectTimelineAudioRow.length; j++) {
            let audio = document.createElement("audio");
            for (let k = 0; k < files.length; k++) {
              if (projectTimelineAudioRow[j].sourceFile == files[k].name) {
                importVideo(files[k], projectTimelineAudioRow[j].videoFPS);
                audio.src = mediaVideos[mediaVideos.length - 1].video.src;
              }
            }

            audio.addEventListener("loadeddata", () => {
              timelineAudioRows[i].addAudio(
                new TimelineAudio(
                  projectTimelineAudioRow[j].inPoint,
                  projectTimelineAudioRow[j].startPoint,
                  projectTimelineAudioRow[j].endPoint,
                  audio,
                  timelineRows,
                  timelineAudioRows,
                  i,
                  fps,
                  timelineDuration,
                  projectTimelineAudioRow[j].maxDuration,
                  propertiesUI.current!,
                  snappingEnabled,
                  playheadScalingOffset
                )
              );
              audio.pause();
            });
            audio.play();
          }
        }
      }
    };
    let projectJSONIndex = 0;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type == "application/json") {
        projectJSONIndex = i;
      }
    }
    fileReader.readAsText(files[projectJSONIndex]);
  }

  useEffect(() => {
    // Wait for load
    if (!initalized) {
      initalized = true;
      mediaFileInput.current!.setAttribute("directory", "");
      mediaFileInput.current!.setAttribute("webkitdirectory", "");
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

      // Gets inputs
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
        if (e.code == "KeyE") {
          exportProject();
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

  // Updates the offset of the playhead
  function updatePlayheadOffset(event: ChangeEvent<HTMLInputElement>) {
    playheadScalingOffset = parseFloat(event.target.value);
    updateTimelineDurations();
    updatePlayheadScalingOffsets();
    updateElementSizes();
  }

  // Toggles the visibility of the render log
  function hideRenderLog() {
    renderLogContainer.current!.classList.add("hidden");
    renderLogContainer.current!.classList.remove("visible");
  }

  return (
    <div>
      <div className="grid grid-cols-5 gap-4 max-w-full my-5 mx-5">
        <div className="border-2 border-gray-400 items-start text-left w-full items-center overflow-y-scroll max-h-[50vh]">
          <button onClick={exportProject} className="mx-2 my-2">
            Download Project
          </button>
          <button onClick={render} className="mx-2 my-2">
            Export Video
          </button>
          <h5>Edit Project</h5>
          <input
            onChange={(e) => {
              if (e.target.files) {
                let loadingProject = false;
                for (let i = 0; i < e.target.files.length; i++) {
                  if (e.target.files[i].type == "application/json") {
                    loadingProject = true;
                    loadProject(e.target.files);
                  }
                }
                if (!loadingProject) {
                  for (let i = 0; i < e.target.files.length; i++) {
                    importVideo(
                      e.target.files[i],
                      parseInt(
                        window.prompt("Input the FPS of the video", "60")!
                      )
                    );
                  }
                }
              }
            }}
            type="file"
            className="mx-2 my-2"
            ref={mediaFileInput}
          />
          <h5>Add Video</h5>
          <input
            onChange={(e) => {
              if (e.target.files) {
                importVideo(
                  e.target.files[0],
                  parseInt(window.prompt("Input the FPS of the video", "60")!)
                );
              }
            }}
            type="file"
            accept="video/*"
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
      <div
        ref={renderLogContainer}
        className="hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex w-3/5 h-3/5"
      >
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center w-full h-full">
          <div
            className="absolute text-3xl z-10 text-black top-5 right-5 w-10 h-10 cursor-pointer"
            onClick={hideRenderLog}
          >
            <FaTimes className="z-10 text-black w-full h-full"></FaTimes>
          </div>
          <textarea
            ref={renderLog}
            className="z-5 text-black justify-center w-full h-full"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
