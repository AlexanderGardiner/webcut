import { ChangeEvent } from "react";

export class Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
  }

  updateXPosition(event: ChangeEvent<HTMLInputElement>) {
    this.x = parseFloat(event?.target.value);
  }
  updateYPosition(event: ChangeEvent<HTMLInputElement>) {
    this.y = parseFloat(event?.target.value);
  }
  updateWidth(event: ChangeEvent<HTMLInputElement>) {
    this.width = parseFloat(event?.target.value);
  }
  updateHeight(event: ChangeEvent<HTMLInputElement>) {
    this.height = parseFloat(event?.target.value);
  }
  updateRotation(event: ChangeEvent<HTMLInputElement>) {
    this.rotation = (2 * Math.PI * parseFloat(event?.target.value)) / 360;
  }
}
