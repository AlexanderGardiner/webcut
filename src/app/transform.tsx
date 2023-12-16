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
}
