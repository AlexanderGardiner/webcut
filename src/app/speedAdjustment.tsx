import { ChangeEvent } from "react";
import { TimelineVideo } from "./timelineVideo";

export class SpeedAdjustment {
  speed: number;
  constructor(speed: number) {
    this.speed = speed;
  }

  updateSpeed(
    event: ChangeEvent<HTMLInputElement>,
    timelineVideo: TimelineVideo
  ) {
    this.speed = parseFloat(event?.target.value);
    if (this.speed) {
      timelineVideo.video.playbackRate = timelineVideo.speedAdjustment.speed;
      timelineVideo.updatePreviewImage();
    } else {
      timelineVideo.video.playbackRate = 1;
      timelineVideo.updatePreviewImage();
    }
  }
}
