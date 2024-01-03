import { TimelineVideo } from "./timelineVideo";

export class TimelineRow {
  videos: TimelineVideo[];
  ui: HTMLDivElement;
  id: number;
  constructor(id: number, parent: HTMLElement) {
    this.videos = [];
    this.ui = document.createElement("div");
    this.id = id;
    this.ui.className =
      "flex flex-col w-full bg-slate-800 my-1 py-5 max-h-10 flex justify-center relative";
    this.ui.setAttribute("timelineRowId", id.toString());
    parent.appendChild(this.ui);
  }
  addVideo(timelineVideo: TimelineVideo) {
    this.videos.push(timelineVideo);
  }
}
