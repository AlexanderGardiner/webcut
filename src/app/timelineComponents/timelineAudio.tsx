"use client";
import { createRoot } from "react-dom/client";
import TransformUI from "../components/transformUI";
import { TimelineRow } from "./timelineRow";
import { Transform } from "./transform";
import { TimelineAudioRow } from "./timelineAudioRow";
import { TimelineElement } from "./timelineElement";

export class TimelineAudio extends TimelineElement {
  audio: HTMLAudioElement;
  constructor(
    inPoint: number,
    startPoint: number,
    endPoint: number,
    audio: HTMLAudioElement,
    timelineRows: TimelineRow[],
    timelineAudioRows: TimelineAudioRow[],
    timelineAudioRowIndex: number,
    timelineFPS: number,
    timelineDuration: number,
    maxDuration: number,
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
      timelineAudioRowIndex,
      timelineFPS,
      timelineDuration,
      maxDuration,
      snappingEnabled,
      playheadScalingOffset,
      propertiesUI
    );
    this.audio = audio;

    // Defines the canvas
    const previewImageCanvas = document.createElement("canvas");
    previewImageCanvas.width = 1600;
    previewImageCanvas.height = 900;
    const previewImageCTX = previewImageCanvas.getContext("2d");
    if (previewImageCTX) {
      previewImageCTX.fillStyle = "black";
      previewImageCTX.fillRect(
        0,
        0,
        previewImageCanvas.width,
        previewImageCanvas.height
      );
    }
    this.previewImage.src = previewImageCanvas.toDataURL("image/png");
    timelineAudioRows[this.rowIndex].ui.appendChild(this.ui);
    this.updatePreviewImage();
  }

  // Removes element
  removeHTML() {
    super.removeHTML();
    this.audio.pause();
    this.audio.removeAttribute("src"); // empty source
    this.audio.load();
    this.audio.remove();
  }
}
