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
  selected: boolean;
  videoFPS: number;
  constructor(
    inPoint: number,
    startPoint: number,
    endPoint: number,
    video: HTMLVideoElement,
    transform: Transform,
    timelineRow: TimelineRow,
    timelineFPS: number,
    timelineDuration: number,
    videoFPS: number
  ) {
    this.inPoint = inPoint;
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.video = video;
    this.timelineRow = timelineRow;
    this.timelineFPS = timelineFPS;
    this.timelineDuration = timelineDuration;
    this.videoFPS = videoFPS;
    this.ui = document.createElement("div");
    this.selected = false;

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
              (timelineRow.ui.clientWidth * (this.endPoint - this.startPoint)) /
              (timelineDuration * timelineFPS)
            ).toString()}px; 
            left: ${(
              (timelineRow.ui.clientWidth * startPoint) /
              (timelineDuration * timelineFPS)
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

    this.previewImage.addEventListener("mousedown", this.mouseDown.bind(this));
    this.ui.appendChild(this.leftSelect);
    this.ui.appendChild(this.rightSelect);
    this.transform = transform;
    this.video.classList.add("hidden");
    document.body.appendChild(this.video);

    document.body.addEventListener("keydown", (e) => {
      if (e.code == "Escape") {
        this.deselect();
      }
    });
  }

  updatePreviewImage() {
    this.ui.setAttribute(
      "style",
      `
            width: ${(
              (this.timelineRow.ui.clientWidth *
                (this.endPoint - this.startPoint)) /
              (this.timelineDuration * this.timelineFPS)
            ).toString()}px; 
            left: ${(
              (this.timelineRow.ui.clientWidth * this.startPoint) /
              (this.timelineDuration * this.timelineFPS)
            ).toString()}px;
            top: 0px;
        `
    );
  }

  mouseDown(event: MouseEvent) {
    let canDrag = true;
    event.preventDefault();
    const handleMouseUp = (e: MouseEvent) => {
      this.selected = !this.selected;
      this.updateSelectedUI();
      canDrag = false;
      e.preventDefault();
      e.stopPropagation();
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener(
        "mousemove",
        handleMouseMove.bind(this)
      );
    };

    const handleMouseMove = (e: MouseEvent) => {
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener(
        "mousemove",
        handleMouseMove.bind(this)
      );
      if (canDrag) {
        this.selected = true;
        this.updateSelectedUI();
        this.dragVideo(event);
        canDrag = false;
      }
    };
    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove.bind(this));
  }

  dragVideo(event: MouseEvent) {
    event.preventDefault();
    var videoRect = this.ui.getBoundingClientRect();
    let initalMousePosition =
      ((this.endPoint - this.startPoint) * (event.clientX - videoRect.left)) /
      videoRect.width;
    let width = this.endPoint - this.startPoint;
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      var timelineRowRect = this.timelineRow.ui.getBoundingClientRect();
      var x =
        (this.timelineDuration *
          this.timelineFPS *
          (e.clientX - timelineRowRect.left)) /
        this.timelineRow.ui.clientWidth;
      this.startPoint = Math.floor(x - initalMousePosition);
      this.endPoint = this.startPoint + width;

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }

  removeHTML() {
    this.ui.remove();
    this.video.pause();
    this.video.removeAttribute("src"); // empty source
    this.video.load();
    this.video.remove();
  }

  deselect() {
    this.selected = false;
    this.updateSelectedUI();
  }

  updateSelectedUI() {
    if (this.selected) {
      this.ui.classList.remove("opacity-100");
      this.ui.classList.add("opacity-50");
    } else {
      this.ui.classList.remove("opacity-50");
      this.ui.classList.add("opacity-100");
    }
  }

  startInPointAdjustment(event: MouseEvent) {
    event.preventDefault();

    const handleMouseUp = (e: MouseEvent) => {
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      var timelineRowRect = this.timelineRow.ui.getBoundingClientRect();
      var x =
        (this.timelineDuration *
          this.timelineFPS *
          (e.clientX - timelineRowRect.left)) /
        this.timelineRow.ui.clientWidth;
      if (
        x < this.endPoint &&
        x >= this.endPoint - this.video.duration * this.timelineFPS
      ) {
        this.inPoint += Math.floor(x - this.startPoint);
        this.startPoint = Math.floor(x);
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }

  startEndPointAdjustment(event: MouseEvent) {
    event.preventDefault();

    const handleMouseUp = (e: MouseEvent) => {
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      var timelineRowRect = this.timelineRow.ui.getBoundingClientRect();
      var x =
        (this.timelineDuration *
          this.timelineFPS *
          (e.clientX - timelineRowRect.left)) /
        this.timelineRow.ui.clientWidth;
      if (
        x - this.startPoint <= this.video.duration * this.timelineFPS &&
        x > this.startPoint
      ) {
        this.endPoint = Math.floor(x);
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }
}
