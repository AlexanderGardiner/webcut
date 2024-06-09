"use client";
import { TimelineAudio } from "./timelineAudio";

// Is a row on the timeline that audio can be placed upon
export class TimelineAudioRow {
  audios: TimelineAudio[];
  ui: HTMLDivElement;
  id: number;
  constructor(id: number, parent: HTMLElement) {
    this.audios = [];
    this.ui = document.createElement("div");
    this.id = id;
    this.ui.className =
      "flex flex-col w-full bg-slate-800 my-1 py-5 max-h-10 flex justify-center relative";
    this.ui.setAttribute("timelineRowId", id.toString());
    parent.appendChild(this.ui);
  }
  addAudio(timelineAudio: TimelineAudio) {
    this.audios.push(timelineAudio);
  }
}
