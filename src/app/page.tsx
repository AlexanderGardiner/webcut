"use client"
import React, { useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";

export default function Home() {
    let previewCanvas: HTMLCanvasElement;
    let previewCTX: CanvasRenderingContext2D;
    let video: HTMLVideoElement;
    let playhead: HTMLInputElement;
    let mediaPool: HTMLDivElement | null = null;
    let fps = 60;
    useEffect(() => {    
        previewCanvas = document.getElementById("previewCanvas") as HTMLCanvasElement;
        previewCTX = previewCanvas.getContext("2d") as CanvasRenderingContext2D;
        playhead = document.getElementById("playhead") as HTMLInputElement;
        mediaPool = document.getElementById("mediaPool") as HTMLDivElement;
    }, []);

    function step() {
        previewCTX.drawImage(
        video,
        0,
        0,
        previewCTX.canvas.width,
        previewCTX.canvas.height
        );
        previewCTX.save();
        
        // Move registration point to the center of the previewCanvas
        previewCTX.translate(100+1600/2,100+900/2);
        previewCTX.rotate(Math.PI/4);// angle must be in radians
        previewCTX.scale(0.25, 0.25);
        // Move registration point back to the top left corner of previewCanvas
        previewCTX.translate((-1600)/2, (-900)/2);
        previewCTX.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        previewCTX.restore();
  
        previewCTX.save();
        previewCTX.translate(-100+1600/2,100+900/2);
        previewCTX.rotate(-Math.PI/4);// angle must be in radians
        previewCTX.scale(0.25, 0.25);
        // Move registration point back to the top left corner of previewCanvas
        previewCTX.translate((-1600)/2, (-900)/2);
        previewCTX.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        previewCTX.restore();

        playhead.value = String(video.currentTime);

        setTimeout(step, 1000 / fps);
    }

    function importVideo(file: File) {
        video = document.createElement("video");
        if (mediaPool) {
            mediaPool.appendChild(video);
        }
        
        video.width = 1600;
        video.height = 900;

        const media = URL.createObjectURL(file);

        video.src = media;
        video.addEventListener('canplaythrough', function () {
            step();
        });
        
    }

    function updatePlayhead(e: React.ChangeEvent<HTMLInputElement>) {
        video.pause();
        video.currentTime = parseFloat(e.target.value);
    }

    function toggleVideoPlay() {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
    return (
        <div>
            <div className="grid grid-cols-5 gap-4 max-w-full my-5 mx-5">
                <div className="items-start text-left w-fit">
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
                    <div id="mediaPool" className="grid grid-cols-3 gap-4 w-full py-5">
                    </div>
                </div>
                <div className="resize-y flex flex-col items-center justify-start max-h-[90vh] min-h-[300px] max-w-full h-min overflow-hidden col-span-3">
                    <div className="flex flex-col items-center justify-start h-3/5 max-w-full mb-5">
                        <canvas id="previewCanvas" width="1600" height="900" className="border-2 border-gray-400 w-min max-h-full max-w-full"></canvas>
                    </div>
                    <button onClick={toggleVideoPlay}>
                        <FaPlay className="" style={{ color: "#6a84f4" }} size={20}/>
                    </button>
                    <input onChange={updatePlayhead} id="playhead" type="range" defaultValue="0" min="0" max="30" step="0.01" className="w-4/5 my-5 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"></input>
                </div>

                

                <div className="items-end text-right w-fit">
                    <h1>Properties</h1>
                </div>
            
            </div>
            
        </div>
    );
}
