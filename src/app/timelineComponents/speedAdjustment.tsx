"use client";
import { ChangeEvent } from "react";
import { TimelineVideo } from "./timelineVideo";

// Allows setting of the speed of elements
export class SpeedAdjustment {
  speed: number;
  constructor(speed: number, video: HTMLVideoElement) {
    this.speed = speed;
    video.playbackRate = this.speed;
  }

  updateSpeed(
    event: ChangeEvent<HTMLInputElement>,
    timelineVideo: TimelineVideo
  ) {
    this.speed = parseFloat(event?.target.value);
    if (this.speed) {
      timelineVideo.endPoint =
        timelineVideo.startPoint +
        (timelineVideo.endPoint - timelineVideo.startPoint) *
          (timelineVideo.video.playbackRate / this.speed);
      timelineVideo.video.playbackRate = timelineVideo.speedAdjustment.speed;
      timelineVideo.updatePreviewImage();
    }
  }
}
