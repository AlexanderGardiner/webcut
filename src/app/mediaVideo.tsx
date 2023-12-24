import { TimelineAudio } from "./timelineAudio";
import { TimelineAudioRow } from "./timelineAudioRow";
import { TimelineRow } from "./timelineRow";
import { TimelineVideo } from "./timelineVideo";
import { Transform } from "./transform";

export class MediaVideo {
  video: HTMLVideoElement;
  previewImage: HTMLImageElement;
  timelineRows: TimelineRow[];
  timelineAudioRows: TimelineAudioRow[];
  timelineFPS: number;
  timelineDuration: number;
  videoFPS: number;
  propertiesUI: HTMLDivElement;
  snappingEnabled: boolean;
  constructor(
    video: HTMLVideoElement,
    parent: HTMLElement,
    timelineRows: TimelineRow[],
    timelineAudioRows: TimelineAudioRow[],
    timelineFPS: number,
    timelineDuration: number,
    videoFPS: number,
    propertiesUI: HTMLDivElement,
    snappingEnabled: boolean
  ) {
    this.video = video;
    this.previewImage = document.createElement("img");
    this.timelineRows = timelineRows;
    this.timelineAudioRows = timelineAudioRows;
    let previewImageCanvas = document.createElement("canvas");
    let previewImageCTX = previewImageCanvas.getContext("2d");
    this.timelineFPS = timelineFPS;
    this.timelineDuration = timelineDuration;
    this.videoFPS = videoFPS;
    this.propertiesUI = propertiesUI;
    this.snappingEnabled = snappingEnabled;
    this.video.addEventListener("loadeddata", () => {
      previewImageCanvas.width = this.video.videoWidth;
      previewImageCanvas.height = this.video.videoHeight;

      if (previewImageCTX) {
        previewImageCTX.drawImage(
          this.video,
          0,
          0,
          previewImageCanvas.width,
          previewImageCanvas.height
        );
      }
      this.previewImage.src = previewImageCanvas.toDataURL("image/png");
      parent.appendChild(this.previewImage);
      this.previewImage.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.dragVideo(e, this.previewImage, this.video);
      });
      this.video.pause();
    });
    this.video.play();
  }

  dragVideo(
    event: MouseEvent,
    videoImage: HTMLImageElement,
    video: HTMLVideoElement
  ) {
    event.preventDefault();
    let tempVideoImage = document.createElement("img");

    tempVideoImage.src = videoImage.src;
    tempVideoImage.setAttribute(
      "style",
      `
                width: ${(
                  (this.timelineRows[0].ui.clientWidth * video.duration) /
                  this.timelineDuration
                ).toString()}px; 
                left: 0px;
            `
    );
    document.body.appendChild(tempVideoImage);

    tempVideoImage.className = "h-10 absolute pointer-events-none";
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      this.updateDraggedVideoPosition(e, tempVideoImage);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.body.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseup", handleMouseUp);
      tempVideoImage.removeAttribute("src");
      tempVideoImage.remove();
      for (let i = 0; i < this.timelineRows.length; i++) {
        this.timelineRows[i].ui.removeEventListener(
          "mouseup",
          handleMouseUpOnTimeline
        );
      }
    };

    const handleMouseUpOnTimeline = (e: MouseEvent) => {
      e.preventDefault();
      let target = e.target as HTMLDivElement;
      if (target.getAttribute("timelineRowId") != null) {
        this.endDragVideo(
          e,
          tempVideoImage,
          parseInt(target.getAttribute("timelineRowId")!),
          video
        );
      } else {
        handleMouseUp(e);
      }

      for (let i = 0; i < this.timelineRows.length; i++) {
        this.timelineRows[i].ui.removeEventListener(
          "mouseup",
          handleMouseUpOnTimeline
        );
      }
      document.body.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseup", handleMouseUp);
    };
    document.body.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseup", handleMouseUp);
    for (let i = 0; i < this.timelineRows.length; i++) {
      this.timelineRows[i].ui.addEventListener(
        "mouseup",
        handleMouseUpOnTimeline
      );
    }
  }

  setSnappingEnabled(snappingEnabled: boolean) {
    this.snappingEnabled = snappingEnabled;
  }

  updateDraggedVideoPosition(e: MouseEvent, tempVideo: HTMLImageElement) {
    tempVideo.style.left = e.x + "px";
    tempVideo.style.top = e.y + "px";
  }

  setTimelineDuration(timelineDuration: number) {
    this.timelineDuration = timelineDuration;
  }

  endDragVideo(
    e: MouseEvent,
    tempVideo: HTMLImageElement,
    i: number,
    originalVideo: HTMLVideoElement
  ) {
    var rect = this.timelineRows[i].ui.getBoundingClientRect();
    var x = (this.timelineDuration * (e.clientX - rect.left)) / rect.width;
    let canAddVideo = true;
    for (let j = 0; j < this.timelineRows[i].videos.length; j++) {
      if (
        this.timelineRows[i].videos[j].startPoint <
          x + originalVideo.duration &&
        this.timelineRows[i].videos[j].endPoint > x
      ) {
        canAddVideo = false;
      }
    }
    if (canAddVideo) {
      let video = document.createElement("video");
      let audioVideo = document.createElement("video");
      video.src = originalVideo.src;
      audioVideo.src = originalVideo.src;
      video.muted = true;

      video.addEventListener("loadeddata", () => {
        let startPoint =
          Math.round(x * this.videoFPS) * (this.timelineFPS / this.videoFPS);
        let endPoint =
          startPoint +
          Math.round(video.duration * this.videoFPS) *
            (this.timelineFPS / this.videoFPS);
        this.timelineRows[i].addVideo(
          new TimelineVideo(
            0,
            startPoint,
            endPoint,
            video,
            new Transform(
              0,
              0,
              video.videoWidth,
              video.videoHeight,
              Math.random() * 2 * Math.PI
            ),
            this.timelineRows,
            this.timelineAudioRows,
            i,
            this.timelineFPS,
            this.timelineDuration,
            this.videoFPS,
            this.propertiesUI,
            this.snappingEnabled
          )
        );

        video.pause();
      });

      audioVideo.addEventListener("loadeddata", () => {
        let startPoint =
          Math.round(x * this.videoFPS) * (this.timelineFPS / this.videoFPS);
        let endPoint =
          startPoint +
          Math.round(video.duration * this.videoFPS) *
            (this.timelineFPS / this.videoFPS);
        let audio = document.createElement("audio");
        let audioContext = new window.AudioContext();
        let source = audioContext.createMediaElementSource(audioVideo);
        let gainNode = audioContext.createGain();
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.connect(audioContext.destination);
        audio.src = source.mediaElement.src;
        audio.pause();
        this.timelineAudioRows[i].addAudio(
          new TimelineAudio(
            0,
            startPoint,
            endPoint,
            audio,
            this.timelineRows,
            this.timelineAudioRows,
            i,
            this.timelineFPS,
            this.timelineDuration,
            this.snappingEnabled
          )
        );
        audio.pause();
        audioVideo.pause();
      });
      video.play();
      audioVideo.play();
    }

    tempVideo.removeAttribute("src");
    tempVideo.remove();
  }
}
