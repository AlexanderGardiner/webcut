import { createRoot } from "react-dom/client";
import TransformUI from "./components/transformUI";
import { TimelineRow } from "./timelineRow";
import { Transform } from "./transform";
import { TimelineAudioRow } from "./timelineAudioRow";
import SpeedUI from "./components/speedUI";
import { SpeedAdjustment } from "./speedAdjustment";
import { TimelineElement } from "./timelineElement";

export class TimelineVideo extends TimelineElement {
  video: HTMLVideoElement;
  transform: Transform;
  videoFPS: number;
  transformUI: any;
  speedUI: any;
  transformUIContainer: HTMLDivElement;
  speedAdjustment: SpeedAdjustment;
  speedAdjustmentUIContainer: HTMLDivElement;
  constructor(
    inPoint: number,
    startPoint: number,
    endPoint: number,
    video: HTMLVideoElement,
    transform: Transform,
    speedAdjustment: SpeedAdjustment,
    timelineRows: TimelineRow[],
    timelineAudioRows: TimelineAudioRow[],
    timelineRowIndex: number,
    timelineFPS: number,
    timelineDuration: number,
    maxDuration: number,
    videoFPS: number,
    propertiesUI: HTMLDivElement,
    snappingEnabled: boolean,
    playheadScalingOffset: number
  ) {
    super(
      inPoint,
      startPoint,
      endPoint,
      timelineRows,
      timelineAudioRows,
      timelineRowIndex,
      timelineFPS,
      timelineDuration,
      maxDuration,
      snappingEnabled,
      playheadScalingOffset,
      propertiesUI
    );

    this.video = video;
    this.videoFPS = videoFPS;
    this.transform = transform;
    this.speedAdjustment = speedAdjustment;
    this.transformUIContainer = document.createElement("div");
    this.speedAdjustmentUIContainer = document.createElement("div");

    this.transformUI = createRoot(this.transformUIContainer).render(
      <TransformUI transform={this.transform} />
    );

    this.speedUI = createRoot(this.speedAdjustmentUIContainer).render(
      <SpeedUI speedAdjustment={this.speedAdjustment} timelineVideo={this} />
    );

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
    timelineRows[this.rowIndex].ui.appendChild(this.ui);
    this.updatePreviewImage();
  }

  removeHTML() {
    super.removeHTML();
    this.video.pause();
    this.video.removeAttribute("src"); // empty source
    this.video.load();
    this.video.remove();
    this.transformUIContainer.remove();
  }

  updateSelectedUI() {
    super.updateSelectedUI();
    if (this.selected) {
      this.propertiesUI.appendChild(this.transformUIContainer);
      this.propertiesUI.appendChild(this.speedAdjustmentUIContainer);
    } else {
      this.propertiesUI.removeChild(this.transformUIContainer);
      this.propertiesUI.removeChild(this.speedAdjustmentUIContainer);
    }
  }
}
