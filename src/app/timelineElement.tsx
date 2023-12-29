import { TimelineRow } from "./timelineRow";
import { TimelineAudioRow } from "./timelineAudioRow";

export class TimelineElement {
  inPoint: number;
  startPoint: number;
  endPoint: number;
  ui: HTMLDivElement;
  timelineRows: TimelineRow[];
  timelineAudioRows: TimelineAudioRow[];
  rowIndex: number;
  previewImage: HTMLImageElement;
  leftSelect: HTMLButtonElement;
  rightSelect: HTMLButtonElement;
  timelineFPS: number;
  timelineDuration: number;
  maxDuration: number;
  selected: boolean;
  snappingEnabled: boolean;
  playheadScalingOffset: number;
  propertiesUI: HTMLDivElement;
  constructor(
    inPoint: number,
    startPoint: number,
    endPoint: number,
    timelineRows: TimelineRow[],
    timelineAudioRows: TimelineAudioRow[],
    rowIndex: number,
    timelineFPS: number,
    timelineDuration: number,
    maxDuration: number,
    snappingEnabled: boolean,
    playheadScalingOffset: number,
    propertiesUI: HTMLDivElement
  ) {
    this.inPoint = inPoint;
    this.startPoint = startPoint;
    this.endPoint = endPoint;
    this.timelineRows = timelineRows;
    this.timelineAudioRows = timelineAudioRows;
    this.rowIndex = rowIndex;
    this.timelineFPS = timelineFPS;
    this.timelineDuration = timelineDuration;
    this.maxDuration = maxDuration;
    this.snappingEnabled = snappingEnabled;
    this.playheadScalingOffset = playheadScalingOffset;
    this.propertiesUI = propertiesUI;
    this.ui = document.createElement("div");

    this.selected = false;
    this.ui.className =
      "absolute flex bg-slate-100 py-5 px-0 pointer-events-none";
    this.previewImage = document.createElement("img");

    this.previewImage.className =
      "absolute w-full overflow-hidden h-full pointer-events-auto";
    this.previewImage.setAttribute("style", "top:0px;");
    this.ui.appendChild(this.previewImage);
    timelineRows[rowIndex].ui.appendChild(this.ui);

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
      this.startStartPointAdjustment.bind(this)
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

    document.body.addEventListener("keydown", (e) => {
      if (e.code == "Escape") {
        this.deselect();
      }
    });
  }

  setSnappingEnabled(snappingEnabled: boolean) {
    this.snappingEnabled = snappingEnabled;
  }
  setPlayheadScalingOffset(playheadScalingOffset: number) {
    this.playheadScalingOffset = playheadScalingOffset;
  }

  updatePreviewImage() {
    this.ui.setAttribute(
      "style",
      `
            width: ${(
              (this.timelineRows[this.rowIndex].ui.clientWidth *
                (this.endPoint - this.startPoint)) /
              (this.timelineDuration * this.timelineFPS)
            ).toString()}px; 
            left: ${(
              (this.timelineRows[this.rowIndex].ui.clientWidth *
                (this.startPoint + this.playheadScalingOffset)) /
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
        this.dragElement(event);
        canDrag = false;
      }
    };
    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove.bind(this));
  }

  dragElement(event: MouseEvent) {
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

      var timelineRowRect =
        this.timelineRows[this.rowIndex].ui.getBoundingClientRect();
      var x =
        (this.timelineDuration *
          this.timelineFPS *
          (e.clientX - timelineRowRect.left)) /
          this.timelineRows[this.rowIndex].ui.clientWidth -
        this.playheadScalingOffset;
      x = Math.floor(x - initalMousePosition);
      if (this.snappingEnabled) {
        for (let i = this.timelineRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < this.timelineRows[i].videos.length; j++) {
            if (this.timelineRows[i].videos[j] != this) {
              if (
                x >
                  this.timelineRows[i].videos[j].endPoint - this.timelineFPS &&
                x < this.timelineRows[i].videos[j].endPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].endPoint + 1;
              }

              if (
                x + width >
                  this.timelineRows[i].videos[j].startPoint -
                    this.timelineFPS &&
                x + width <
                  this.timelineRows[i].videos[j].startPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].startPoint - width - 1;
              }

              if (
                x >
                  this.timelineRows[i].videos[j].startPoint -
                    this.timelineFPS &&
                x < this.timelineRows[i].videos[j].startPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].startPoint;
              }

              if (
                x + width >
                  this.timelineRows[i].videos[j].endPoint - this.timelineFPS &&
                x + width <
                  this.timelineRows[i].videos[j].endPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].endPoint - width;
              }
            }
          }
        }

        for (let i = this.timelineAudioRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < this.timelineAudioRows[i].audios.length; j++) {
            if (this.timelineAudioRows[i].audios[j] != this) {
              if (
                x >
                  this.timelineAudioRows[i].audios[j].endPoint -
                    this.timelineFPS &&
                x <
                  this.timelineAudioRows[i].audios[j].endPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].endPoint + 1;
              }

              if (
                x + width >
                  this.timelineAudioRows[i].audios[j].startPoint -
                    this.timelineFPS &&
                x + width <
                  this.timelineAudioRows[i].audios[j].startPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].startPoint - width - 1;
              }

              if (
                x >
                  this.timelineAudioRows[i].audios[j].startPoint -
                    this.timelineFPS &&
                x <
                  this.timelineAudioRows[i].audios[j].startPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].startPoint;
              }

              if (
                x + width >
                  this.timelineAudioRows[i].audios[j].endPoint -
                    this.timelineFPS &&
                x + width <
                  this.timelineAudioRows[i].audios[j].endPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].endPoint - width;
              }
            }
          }
        }
      }

      if (x >= 0) {
        this.startPoint = x;
        this.endPoint = this.startPoint + width;
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }

  removeHTML() {
    this.ui.remove();
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

  startStartPointAdjustment(event: MouseEvent) {
    event.preventDefault();

    const handleMouseUp = (e: MouseEvent) => {
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      var timelineRowRect =
        this.timelineRows[this.rowIndex].ui.getBoundingClientRect();
      var x =
        (this.timelineDuration *
          this.timelineFPS *
          (e.clientX - timelineRowRect.left)) /
          this.timelineRows[this.rowIndex].ui.clientWidth -
        this.playheadScalingOffset;
      if (this.snappingEnabled) {
        for (let i = this.timelineRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < this.timelineRows[i].videos.length; j++) {
            if (this.timelineRows[i].videos[j] != this) {
              if (
                x >
                  this.timelineRows[i].videos[j].endPoint - this.timelineFPS &&
                x < this.timelineRows[i].videos[j].endPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].endPoint + 1;
              }

              if (
                x >
                  this.timelineRows[i].videos[j].startPoint -
                    this.timelineFPS &&
                x < this.timelineRows[i].videos[j].startPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].startPoint;
              }
            }
          }
        }

        for (let i = this.timelineAudioRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < this.timelineAudioRows[i].audios.length; j++) {
            if (this.timelineAudioRows[i].audios[j] != this) {
              if (
                x >
                  this.timelineAudioRows[i].audios[j].endPoint -
                    this.timelineFPS &&
                x <
                  this.timelineAudioRows[i].audios[j].endPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].endPoint + 1;
              }

              if (
                x >
                  this.timelineAudioRows[i].audios[j].startPoint -
                    this.timelineFPS &&
                x <
                  this.timelineAudioRows[i].audios[j].startPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].startPoint;
              }
            }
          }
        }
      }

      if (
        x < this.endPoint &&
        x >=
          this.endPoint - this.inPoint - this.maxDuration * this.timelineFPS &&
        this.inPoint + x - this.startPoint >= 0 &&
        x >= 0
      ) {
        this.inPoint += x - this.startPoint;
        this.startPoint = x;
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }
  setTimelineDuration(timelineDuration: number) {
    this.timelineDuration = timelineDuration;
  }

  startEndPointAdjustment(event: MouseEvent) {
    event.preventDefault();

    const handleMouseUp = (e: MouseEvent) => {
      document.body.removeEventListener("mouseup", handleMouseUp, true);
      document.body.removeEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      var timelineRowRect =
        this.timelineRows[this.rowIndex].ui.getBoundingClientRect();
      var x =
        (this.timelineDuration *
          this.timelineFPS *
          (e.clientX - timelineRowRect.left)) /
          this.timelineRows[this.rowIndex].ui.clientWidth -
        this.playheadScalingOffset;
      let width = this.endPoint - this.startPoint;
      if (this.snappingEnabled) {
        for (let i = this.timelineRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < this.timelineRows[i].videos.length; j++) {
            if (this.timelineRows[i].videos[j] != this) {
              if (
                x >
                  this.timelineRows[i].videos[j].startPoint -
                    this.timelineFPS &&
                x < this.timelineRows[i].videos[j].startPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].startPoint - 1;
              }

              if (
                x >
                  this.timelineRows[i].videos[j].endPoint - this.timelineFPS &&
                x < this.timelineRows[i].videos[j].endPoint + this.timelineFPS
              ) {
                x = this.timelineRows[i].videos[j].endPoint;
              }
            }
          }
        }

        for (let i = this.timelineAudioRows.length - 1; i >= 0; i--) {
          for (let j = 0; j < this.timelineAudioRows[i].audios.length; j++) {
            if (this.timelineAudioRows[i].audios[j] != this) {
              if (
                x >
                  this.timelineAudioRows[i].audios[j].startPoint -
                    this.timelineFPS &&
                x <
                  this.timelineAudioRows[i].audios[j].startPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].startPoint - 1;
              }

              if (
                x >
                  this.timelineAudioRows[i].audios[j].endPoint -
                    this.timelineFPS &&
                x <
                  this.timelineAudioRows[i].audios[j].endPoint +
                    this.timelineFPS
              ) {
                x = this.timelineAudioRows[i].audios[j].endPoint;
              }
            }
          }
        }
      }
      if (
        x - this.startPoint + this.inPoint <=
          this.maxDuration * this.timelineFPS &&
        x > this.startPoint &&
        x - width >= 0
      ) {
        this.endPoint = Math.floor(x);
      }

      this.updatePreviewImage();
    };

    document.body.addEventListener("mouseup", handleMouseUp, true);
    document.body.addEventListener("mousemove", handleMouseMove);
  }
}
