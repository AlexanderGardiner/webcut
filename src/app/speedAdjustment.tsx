import { ChangeEvent } from "react";

export class SpeedAdjustment {
  speed: number;
  constructor(speed: number) {
    this.speed = speed;
  }

  updateSpeed(event: ChangeEvent<HTMLInputElement>) {
    this.speed = parseFloat(event?.target.value);
  }
}
