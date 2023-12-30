import React, { ChangeEvent, useRef, useState } from "react";
import { Transform } from "../transform";
import { SpeedAdjustment } from "../speedAdjustment";
import { TimelineVideo } from "../timelineVideo";
interface ChildComponentProps {
  speedAdjustment: SpeedAdjustment;
  timelineVideo: TimelineVideo;
}
const SpeedUI: React.FC<ChildComponentProps> = ({
  speedAdjustment,
  timelineVideo,
}) => {
  let speed = speedAdjustment.speed;

  return (
    <div className="items-center w-full">
      <form
        action="#"
        method="post"
        className="flex flex-col items-center w-full"
      >
        <div className="grid items-center w-full grid-cols-2 py-2">
          <label htmlFor="text-input" className="text-right pr-5">
            Speed:
          </label>
          <div className="flex pl-5 w-full">
            <input
              type="text"
              name="text-input"
              defaultValue={speed}
              className="w-3/5 text-black"
              onChange={(e) => speedAdjustment.updateSpeed(e, timelineVideo)}
            ></input>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SpeedUI;
