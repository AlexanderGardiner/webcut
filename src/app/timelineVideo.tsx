import { TimelineRow } from "./timelineRow";
import { Transform } from "./transform";

export class TimelineVideo {
  inPoint: number;
  startPoint: number;
  endPoint: number;
  video: HTMLVideoElement;
  ui: HTMLDivElement;
  timelineRow: TimelineRow;
  previewImage: HTMLImageElement;
  transform: Transform;
  leftSelect: HTMLButtonElement;
  rightSelect: HTMLButtonElement;
  timelineFPS: number;
  timelineDuration: number;
  constructor(
    inPoint: number,
    startPoint: number,
    endPoint: number,
    video: HTMLVideoElement,
    transform: Transform,
    timelineRow: TimelineRow,
    timelineFPS: number,
    timelineDuration: number
  ) {
    this.inPoint = inPoint;
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.video = video;
    this.timelineRow = timelineRow;
    this.timelineFPS = timelineFPS;
    this.timelineDuration = timelineDuration;
    this.ui = document.createElement("div");

    this.ui.className =
      "absolute flex bg-slate-100 py-5 px-0 pointer-events-none";
    this.previewImage = document.createElement("img");
    const previewImageCanvas = document.createElement("canvas");
    previewImageCanvas.width = this.video.videoWidth;
    previewImageCanvas.height = this.video.videoHeight;
    const previewImageCTX = previewImageCanvas.getContext("2d");
    if (previewImageCTX) {
      previewImageCTX.drawImage(
        video,
        0,
        0,
        previewImageCanvas.width,
        previewImageCanvas.height
      );
    }
    this.previewImage.src = previewImageCanvas.toDataURL("image/png");
    this.previewImage.className =
      "absolute w-full overflow-hidden h-full pointer-events-auto";
    this.previewImage.setAttribute("style", "top:0px;");
    this.ui.appendChild(this.previewImage);
    timelineRow.ui.appendChild(this.ui);
    this.ui.setAttribute(
      "style",
      `
            width: ${(
              (timelineRow.ui.clientWidth * this.video.duration) /
              timelineDuration
            ).toString()}px; 
            left: ${(
              (timelineRow.ui.clientWidth * startPoint) /
              timelineDuration
            ).toString()}px;
            top: 0px;
        `
    );
    this.leftSelect = document.createElement("button");
    this.leftSelect.className =
      "absolute flex bg-slate-100 w-[5px] py-0 bg-white h-10 px-0 pointer-events-auto";
    this.leftSelect.setAttribute(
      "style",
      `
            top: 0px;
            z-index: 3;
        `
    );
    this.leftSelect.addEventListener(
      "mousedown",
      this.startInPointAdjustment.bind(this)
    );

    this.rightSelect = document.createElement("button");
    this.rightSelect.className =
      "absolute flex bg-slate-100 w-[5px] py-0 bg-white h-10 px-0 pointer-events-auto";
    this.rightSelect.setAttribute(
      "style",
      `
            top: 0px;
            right: 0px;
            z-index: 3;
        `
    );
    this.rightSelect.addEventListener(
      "mousedown",
      this.startEndPointAdjustment.bind(this)
    );

    this.previewImage.addEventListener("mousedown", this.dragVideo.bind(this));
    this.ui.appendChild(this.leftSelect);
    this.ui.appendChild(this.rightSelect);
    this.transform = transform;
  }

  updatePreviewImage() {
    this.ui.setAttribute(
      "style",
      `
            width: ${(
              (this.timelineRow.ui.clientWidth *
                (this.endPoint - this.startPoint)) /
              this.timelineDuration
            ).toString()}px; 
            left: ${(
              (this.timelineRow.ui.clientWidth * this.startPoint) /
              this.timelineDuration
            ).toString()}px;
            top: 0px;
        `
    );
  }

  dragVideo(event: MouseEvent) {
    event.preventDefault();
    console.log("dragVideo triggered");
    console.log(event);
    var videoRect = this.ui.getBoundingClientRect();
    let initalMousePosition =
      ((this.endPoint - this.startPoint) * (event.clientX - videoRect.left)) /
      videoRect.width;
    let width = this.endPoint - this.startPoint;

    const handleMouseUp = (e: MouseEvent) => {
      console.log("MouseUp event triggered");
      console.log(this);
      document.body.removeEventListener("mouseup", handleMouseUp);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      console.log("MouseMove event triggered");

      var timelineRowRect = this.timelineRow.ui.getBoundingClientRect();
      var x =
        (this.timelineDuration * (e.clientX - timelineRowRect.left)) /
        this.timelineRow.ui.clientWidth;
      if (x < this.endPoint && x >= this.endPoint - this.video.duration) {
        this.startPoint =
          Math.floor((x - initalMousePosition) * this.timelineFPS) /
          this.timelineFPS;
        this.endPoint =
          ((this.startPoint + width) * this.timelineFPS) / this.timelineFPS;
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }

  startInPointAdjustment(event: MouseEvent) {
    event.preventDefault();
    console.log("startInPointAdjustment triggered");
    console.log(event);

    const handleMouseUp = (e: MouseEvent) => {
      console.log("MouseUp event triggered");
      console.log(this);
      document.body.removeEventListener("mouseup", handleMouseUp);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      console.log("MouseMove event triggered");
      var timelineRowRect = this.timelineRow.ui.getBoundingClientRect();
      var x =
        (this.timelineDuration * (e.clientX - timelineRowRect.left)) /
        this.timelineRow.ui.clientWidth;
      if (x < this.endPoint && x >= this.endPoint - this.video.duration) {
        this.inPoint +=
          Math.floor((x - this.startPoint) * this.timelineFPS) /
          this.timelineFPS;
        this.startPoint = Math.floor(x * this.timelineFPS) / this.timelineFPS;
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }

  startEndPointAdjustment(event: MouseEvent) {
    event.preventDefault();
    console.log("startOutPointAdjustment triggered");
    console.log(event);

    const handleMouseUp = (e: MouseEvent) => {
      console.log("MouseUp event triggered");
      console.log(this);
      document.body.removeEventListener("mouseup", handleMouseUp);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      console.log("MouseMove event triggered");
      var timelineRowRect = this.timelineRow.ui.getBoundingClientRect();
      var x =
        (this.timelineDuration * (e.clientX - timelineRowRect.left)) /
        this.timelineRow.ui.clientWidth;
      if (x - this.startPoint <= this.video.duration && x > this.startPoint) {
        this.endPoint = Math.floor(x * this.timelineFPS) / this.timelineFPS;
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }
}
