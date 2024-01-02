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
      console.log("before" + timelineVideo.startPoint);
      console.log("before" + timelineVideo.endPoint);
      timelineVideo.endPoint =
        timelineVideo.startPoint +
        (timelineVideo.endPoint - timelineVideo.startPoint) *
          (timelineVideo.video.playbackRate / this.speed);
      timelineVideo.video.playbackRate = timelineVideo.speedAdjustment.speed;
      console.log(timelineVideo.endPoint);
      timelineVideo.updatePreviewImage();
    }
  }
}
