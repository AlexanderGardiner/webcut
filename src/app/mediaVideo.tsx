import { TimelineRow } from "./timelineRow";
import { TimelineVideo } from "./timelineVideo";
import { Transform } from "./transform";

export class MediaVideo {
  video: HTMLVideoElement;
  previewImage: HTMLImageElement;
  timelineRows: TimelineRow[];
  timelineFPS: number;
  constructor(
    video: HTMLVideoElement,
    parent: HTMLElement,
    timelineRows: TimelineRow[],
    timelineFPS: number
  ) {
    console.log(video);
    this.video = video;
    this.previewImage = document.createElement("img");
    this.timelineRows = timelineRows;
    let previewImageCanvas = document.createElement("canvas");
    let previewImageCTX = previewImageCanvas.getContext("2d");
    this.timelineFPS = timelineFPS;
    this.video.addEventListener("loadeddata", () => {
      previewImageCanvas.width = this.video.width;
      previewImageCanvas.height = this.video.height;

      if (previewImageCTX) {
        console.log(
          previewImageCTX.drawImage(
            this.video,
            0,
            0,
            previewImageCanvas.width,
            previewImageCanvas.height
          )
        );
      } else {
        console.log("ahhh");
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
                  100
                ).toString()}px; 
                left: 0px;
            `
    );
    document.body.appendChild(tempVideoImage);

    tempVideoImage.className = "h-10 absolute pointer-events-none";
    const handleMouseMove = (e: MouseEvent) => {
      console.log("handle mouse move");
      e.preventDefault();
      this.updateDraggedVideoPosition(e, tempVideoImage);
    };

    const handleMouseUp = (e: MouseEvent) => {
      console.log("handle mouse up");
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
      console.log("mouseup on timeline");
      console.log("handle mouse up on timeline");
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

  updateDraggedVideoPosition(e: MouseEvent, tempVideo: HTMLImageElement) {
    tempVideo.style.left = e.x + "px";
    tempVideo.style.top = e.y + "px";
  }

  endDragVideo(
    e: MouseEvent,
    tempVideo: HTMLImageElement,
    i: number,
    originalVideo: HTMLVideoElement
  ) {
    var rect = this.timelineRows[i].ui.getBoundingClientRect();
    var x = (100 * (e.clientX - rect.left)) / rect.width;
    var y = (100 * (e.clientY - rect.top)) / rect.height;
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
      video.src = originalVideo.src;
      video.play();
      video.addEventListener("loadeddata", () => {
        this.timelineRows[i].addVideo(
          new TimelineVideo(
            0,
            Math.floor(x * 60) / 60,
            Math.floor(x * 60) / 60 + Math.floor(video.duration * 60) / 60,
            video,
            new Transform(0, 0, 1600, 900, Math.random() * 2 * Math.PI),
            this.timelineRows[i],
            this.timelineFPS
          )
        );
        video.pause();
      });
    }

    tempVideo.removeAttribute("src");
    tempVideo.remove();
  }
}
