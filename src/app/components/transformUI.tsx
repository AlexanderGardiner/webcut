import React, { ChangeEvent, useRef, useState } from "react";
import { Transform } from "../transform";
interface ChildComponentProps {
  transform: Transform;
}
const TransformUI: React.FC<ChildComponentProps> = ({ transform }) => {
  let xPosition = transform.x;
  let yPosition = transform.y;
  let width = transform.width;
  let height = transform.height;
  let rotation = transform.rotation;
  return (
    <div className="items-center w-full">
      <form
        action="#"
        method="post"
        className="flex flex-col items-center w-full"
      >
        <div className="grid items-center w-full grid-cols-2 py-2">
          <label htmlFor="text-input" className="text-right pr-5">
            X Position:
          </label>
          <div className="flex pl-5 w-full">
            <input
              type="text"
              name="text-input"
              defaultValue={xPosition}
              className="w-3/5 text-black"
              onChange={(e) => transform.updateXPosition(e)}
            ></input>
          </div>
        </div>
        <div className="grid items-center w-full grid-cols-2 py-2">
          <label htmlFor="text-input" className="text-right pr-5">
            Y Position:
          </label>
          <div className="flex pl-5 w-full">
            <input
              type="text"
              name="text-input"
              defaultValue={yPosition}
              className="w-3/5 text-black"
              onChange={(e) => transform.updateYPosition(e)}
            ></input>
          </div>
        </div>
        <div className="grid items-center w-full grid-cols-2 py-2">
          <label htmlFor="text-input" className="text-right pr-5">
            Width:
          </label>
          <div className="flex pl-5 w-full">
            <input
              type="text"
              name="text-input"
              defaultValue={width}
              className="w-3/5 text-black"
              onChange={(e) => transform.updateWidth(e)}
            ></input>
          </div>
        </div>
        <div className="grid items-center w-full grid-cols-2 py-2">
          <label htmlFor="text-input" className="text-right pr-5">
            Height:
          </label>
          <div className="flex pl-5 w-full">
            <input
              type="text"
              name="text-input"
              defaultValue={height}
              className="w-3/5 text-black"
              onChange={(e) => transform.updateHeight(e)}
            ></input>
          </div>
        </div>
        <div className="grid items-center w-full grid-cols-2 py-2">
          <label htmlFor="text-input" className="text-right pr-5">
            Rotation:
          </label>
          <div className="flex pl-5 w-full">
            <input
              type="text"
              id="text-input"
              defaultValue={(360 * rotation) / (2 * Math.PI)}
              className="w-3/5 text-black"
              onChange={(e) => transform.updateRotation(e)}
            ></input>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TransformUI;
