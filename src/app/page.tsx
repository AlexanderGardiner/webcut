"use client"
import React, { useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";

export default function Home() {
    let previewCanvas: HTMLCanvasElement;
    let previewCTX: CanvasRenderingContext2D;
    let playhead: HTMLInputElement;
    let mediaPool: HTMLDivElement | null = null;
    let fps = 60;
    let timelineRows: timelineRow[] = [];
    let playing = false;
    let timelineTime = 0;
    let currentTime: number;
    let previousTime: number; 

    class timelineRow {
        videos: timelineVideo[];
        constructor() {
            this.videos = [];
        }
        addVideo(timelineVideo: timelineVideo) {
            this.videos.push(timelineVideo);
            step();
        }

    }

    class timelineVideo {
        inPoint: number;
        outPoint: number;
        startPoint: number;
        endPoint: number;
        video: HTMLVideoElement;
        constructor(inPoint: number, outPoint: number, startPoint: number, endPoint: number, video: HTMLVideoElement) {
            this.inPoint = inPoint;
            this.outPoint = outPoint;
            this.startPoint = startPoint;
            this.endPoint = endPoint;
            this.video = video;
        }
    }
    
    useEffect(() => {    
        previewCanvas = document.getElementById("previewCanvas") as HTMLCanvasElement;
        previewCTX = previewCanvas.getContext("2d") as CanvasRenderingContext2D;
        playhead = document.getElementById("playhead") as HTMLInputElement;
        mediaPool = document.getElementById("mediaPool") as HTMLDivElement;
    }, []);

    

    function step() {
        currentTime = performance.now();
        previewCTX.clearRect(0,0, previewCanvas.width, previewCanvas.height);
        if (playing) {
            timelineTime += (currentTime-previousTime)/1000;
            playhead.value = timelineTime.toString();
        }
        
        for (let i=0; i<timelineRows.length; i++) {
            for (let j=0; j<timelineRows[i].videos.length; j++) {
                if (timelineRows[i].videos[j].startPoint<=timelineTime && timelineRows[i].videos[j].endPoint>=timelineTime) {
                    if (!playing) {
                        timelineRows[i].videos[j].video.currentTime = timelineTime - timelineRows[i].videos[j].startPoint;
                    }
                    if (playing && timelineRows[i].videos[j].video.paused) {
                        timelineRows[i].videos[j].video.currentTime = timelineTime - timelineRows[i].videos[j].startPoint;
                        timelineRows[i].videos[j].video.play();
                        console.log("playing");
                    }  
                    previewCTX.drawImage(
                        timelineRows[i].videos[j].video,
                        0,
                        0,
                        previewCTX.canvas.width,
                        previewCTX.canvas.height
                        );
                } else {
                    timelineRows[i].videos[j].video.pause();
                }
                if (!playing) {
                    timelineRows[i].videos[j].video.pause();
                }
            }
        }
        // previewCTX.drawImage(
        // video,
        // 0,
        // 0,
        // previewCTX.canvas.width,
        // previewCTX.canvas.height
        // );
        // previewCTX.save();
        
        // // Move registration point to the center of the previewCanvas
        // previewCTX.translate(100+1600/2,100+900/2);
        // previewCTX.rotate(Math.PI/4);// angle must be in radians
        // previewCTX.scale(0.25, 0.25);
        // // Move registration point back to the top left corner of previewCanvas
        // previewCTX.translate((-1600)/2, (-900)/2);
        // previewCTX.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        // previewCTX.restore();
  
        // previewCTX.save();
        // previewCTX.translate(-100+1600/2,100+900/2);
        // previewCTX.rotate(-Math.PI/4);// angle must be in radians
        // previewCTX.scale(0.25, 0.25);
        // // Move registration point back to the top left corner of previewCanvas
        // previewCTX.translate((-1600)/2, (-900)/2);
        // previewCTX.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        // previewCTX.restore();

        previousTime = currentTime;
        setTimeout(step, 1000 / fps);
    }

    function importVideo(file: File) {
        let video = document.createElement("video");
        if (mediaPool) {
            mediaPool.appendChild(video);
        }
        
        video.width = 1600;
        video.height = 900;

        const media = URL.createObjectURL(file);

        video.src = media;
        timelineRows[0].addVideo(new timelineVideo(0,10,0,10,video))
        
    }

    function updatePlayhead(e: React.ChangeEvent<HTMLInputElement>) {
        playing = false;

        timelineTime = parseFloat(e.target.value);
    }

    function toggleVideoPlay() {
        playing = !playing;
    }

    timelineRows.push(new timelineRow());
    

    return (
        <div>
            <div className="grid grid-cols-5 gap-4 max-w-full my-5 mx-5">
                <div className="border-2 border-gray-400 items-start text-left w-full items-center overflow-y-scroll max-h-[50vh]">
                    <input
                        onChange={(e) => {
                        if (e.target.files) {
                            importVideo(e.target.files[0]);
                        }
                        }}
                        type="file"
                        id="input"
                        name="input_video"
                        accept="video/mp4, video/mov"
                    />
                    <div id="mediaPool" className="grid grid-cols-2 gap-4 w-full h-full py-5">
                    
                    </div>
                </div>
                <div className="resize-y flex flex-col items-center justify-start max-h-[90vh] min-h-[300px] max-w-full h-min overflow-hidden col-span-3">
                    <div className="flex flex-col items-center justify-start h-[50vh] max-w-full mb-5">
                        <canvas id="previewCanvas" width="1600" height="900" className="border-2 border-gray-400 w-min max-h-full max-w-full"></canvas>
                    </div>
                    <button onClick={toggleVideoPlay}>
                        <FaPlay className="" style={{ color: "#6a84f4" }} size={20}/>
                    </button>
                    <input onChange={updatePlayhead} id="playhead" type="range" defaultValue="0" min="0" max="100" step="0.01" className="w-4/5 my-5 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"></input>
                </div>

                

                <div className="items-end text-right max-h-[50vh] border-2 border-gray-400 w-full">
                    <h1>Properties</h1>
                </div>
            
            </div>
            <div className="flex flex-col items-center w-full">
                <div className="flex flex-col items-center w-[95vw]">
                    <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
                        Timeline Row 1
                    </div>
                    <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
                        Timeline Row 2
                    </div>
                    <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
                        Timeline Row 3
                    </div>
                </div>
                <div className="flex flex-col items-center w-[95vw]">
                    <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
                        Audio Row 1
                    </div>
                    <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
                        Audio Row 2
                    </div>
                    <div className="flex flex-col items-center w-full bg-slate-800 my-1 py-5">
                        Audio Row 3
                    </div>
                </div>
            </div>
            
            
        </div>
    );
}
