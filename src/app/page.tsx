"use client"
import React, { useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";

export default function Home() {
    let previewCanvas: HTMLCanvasElement;
    let previewCTX: CanvasRenderingContext2D;
    let playhead: HTMLInputElement;
    let mediaPool: HTMLDivElement | null = null;
    let playheadDiv: HTMLDivElement;
    let fps = 60;
    let timelineRows: timelineRow[] = [];
    let timelineRowsElement: HTMLDivElement;
    let playing = false;
    let currentTime: number;
    let previousTime: number; 
    let timelineTime:number = 0;


    useEffect(() => {    
        previewCanvas = document.getElementById("previewCanvas") as HTMLCanvasElement;
        previewCTX = previewCanvas.getContext("2d") as CanvasRenderingContext2D;
        playhead = document.getElementById("playhead") as HTMLInputElement;
        mediaPool = document.getElementById("mediaPool") as HTMLDivElement;
        timelineRowsElement = document.getElementById("timelineRows") as HTMLDivElement;
        playheadDiv = document.getElementById("playheadDiv") as HTMLDivElement;
        
        timelineRows.push(new timelineRow(0));
        playheadDiv.style.position = "relative";
        playheadDiv.style.width = "6px";
        
    }, []);
    
    class timelineRow {
        videos: timelineVideo[];
        ui: HTMLDivElement;
        id: number;
        constructor(id: number) {
            this.videos = [];
            this.ui = document.createElement("div");
            this.id = id;
            this.ui.className = "flex flex-col w-full bg-slate-800 my-1 py-5 max-h-10 flex justify-center relative";
            this.ui.setAttribute("timelineRowId", id.toString());
            timelineRowsElement.appendChild(this.ui);
            
            

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
        ui: HTMLDivElement;
        timelineRowId: number;
        previewImage: HTMLImageElement;
        constructor(inPoint: number, outPoint: number, startPoint: number, endPoint: number, timelineRowId: number, video: HTMLVideoElement) {
            this.inPoint = inPoint;
            this.outPoint = outPoint;
            this.startPoint = startPoint;
            this.endPoint = endPoint;
            this.timelineRowId = timelineRowId
            this.video = video;
            this.ui = document.createElement("div");
            
            this.ui.className = "absolute flex bg-slate-100 py-5 px-0 pointer-events-none";
            this.previewImage = document.createElement("img");
            const previewImageCanvas = document.createElement('canvas');
            previewImageCanvas.width = this.video.videoWidth;
            previewImageCanvas.height = this.video.videoHeight;
            const previewImageCTX = previewImageCanvas.getContext('2d');
            if (previewImageCTX) {
                previewImageCTX.drawImage(video, 0, 0, previewImageCanvas.width, previewImageCanvas.height);
            }
            this.previewImage.src = previewImageCanvas.toDataURL('image/png');
            this.previewImage.className = "absolute w-full overflow-hidden h-full min-w-max"
            this.previewImage.setAttribute("style","top:0px;");
            this.ui.appendChild(this.previewImage);
            timelineRows[timelineRowId].ui.appendChild(this.ui);
            this.ui.setAttribute("style", `
                width: ${(timelineRows[timelineRowId].ui.clientWidth * this.video.duration / 100).toString()}px; 
                left: ${(timelineRows[timelineRowId].ui.clientWidth * (startPoint + 1) / 100).toString()}px;
                top: 0px;
            `);
        }
    }
    
    

    

    function step() {
        playheadDiv.style.left = (-3+timelineRows[0].ui.clientWidth * (timelineTime+1)/100).toString()+"px";
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
                        timelineRows[i].videos[j].video.currentTime = timelineTime - timelineRows[i].videos[j].startPoint - 2;
                    }
                    if (playing && timelineRows[i].videos[j].video.paused) {
                        timelineRows[i].videos[j].video.currentTime = timelineTime - timelineRows[i].videos[j].startPoint - 2;
                        timelineRows[i].videos[j].video.addEventListener('seeked', function handleSeeked() {
                            timelineRows[i].videos[j].video.play();
                        });
                        
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
        
        //timelineRows[0].addVideo(new timelineVideo(0,10,0,10,video))
        video.addEventListener('mousedown', (e) => {     
            e.preventDefault();       
            dragVideo(e, video);
            
        });
        
        
        
    }

    function dragVideo(event: MouseEvent, video: HTMLVideoElement) {
        event.preventDefault();
        const clickedElement = event.target as HTMLVideoElement;
        let tempVideoImage = document.createElement("img");
        const previewImageCanvas = document.createElement('canvas');
        previewImageCanvas.width = video.videoWidth;
        previewImageCanvas.height = video.videoHeight;
        const previewImageCTX = previewImageCanvas.getContext('2d');
        if (previewImageCTX) {
            previewImageCTX.drawImage(video, 0, 0, previewImageCanvas.width, previewImageCanvas.height);
        }
        tempVideoImage.src = previewImageCanvas.toDataURL('image/png');
        tempVideoImage.setAttribute("style", `
                width: ${(timelineRows[0].ui.clientWidth * video.duration / 100).toString()}px; 
                left: 0px;
            `);
        document.body.appendChild(tempVideoImage);
        
        tempVideoImage.className = "h-10 absolute pointer-events-none";
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            updateDraggedVideoPosition(e, tempVideoImage);
          };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            tempVideoImage.removeAttribute("src");
            tempVideoImage.remove();
            for (let i=0; i<timelineRows.length; i++) {
                timelineRows[i].ui.removeEventListener('mouseup', handleMouseUpOnTimeline);
            }
          };
      
        const handleMouseUpOnTimeline = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            let target = e.target as HTMLDivElement;
            if (target.getAttribute("timelineRowId")!=null) {
                endDragVideo(e, tempVideoImage, parseInt(target.getAttribute("timelineRowId")!), video);
            }
            
            for (let i=0; i<timelineRows.length; i++) {
                timelineRows[i].ui.removeEventListener('mouseup', handleMouseUpOnTimeline);
            }
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        for (let i=0; i<timelineRows.length; i++) {
            timelineRows[i].ui.addEventListener('mouseup', handleMouseUpOnTimeline); 

        }
        

        
        
        
    
        
    }


    
    function updateDraggedVideoPosition(e: MouseEvent, tempVideo: HTMLImageElement) {

        tempVideo.style.left = e.x+"px";
        tempVideo.style.top = e.y+"px";
    }

    function endDragVideo(e: MouseEvent, tempVideo: HTMLImageElement, i: number, originalVideo: HTMLVideoElement) {
        var rect = timelineRows[i].ui.getBoundingClientRect(); 
        var x = 100*(e.clientX - rect.left)/rect.width; 
        var y = 100*(e.clientY - rect.top)/rect.height; 
        let canAddVideo = true;
        for (let j=0; j<timelineRows[i].videos.length; j++) {
            if (timelineRows[i].videos[j].startPoint<x+originalVideo.duration-1 && timelineRows[i].videos[j].endPoint>x-1) {
                canAddVideo = false;
            }
        }
        if (canAddVideo) {
            timelineRows[i].addVideo(new timelineVideo(0, originalVideo.duration,x-1,x+originalVideo.duration-1,i,originalVideo));

        }

        tempVideo.removeAttribute("src");
        tempVideo.remove();
    }

    

    function updatePlayhead(e: React.ChangeEvent<HTMLInputElement>) {
        playing = false;

        timelineTime = parseFloat(e.target.value);
        
        playheadDiv.style.left = (-3+timelineRows[0].ui.clientWidth * (timelineTime+1)/100).toString()+"px";
    }

    function toggleVideoPlay() {
        playing = !playing;
    }

    
    

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
                        className="mx-2 my-2"
                    />
                    <div id="mediaPool" className="px-2 grid grid-cols-2 gap-4 w-full h-full">
                    
                    </div>
                </div>
                <div className="resize-y flex flex-col items-center justify-start max-h-[90vh] min-h-[300px] max-w-full h-min overflow-hidden col-span-3">
                    <div className="flex flex-col items-center justify-start h-[50vh] max-w-full mb-5">
                        <canvas id="previewCanvas" width="1600" height="900" className="border-2 border-gray-400 w-min max-h-full max-w-full"></canvas>
                    </div>
                    <button onClick={toggleVideoPlay}>
                        <FaPlay className="" style={{ color: "#6a84f4" }} size={20}/>
                    </button>
                    
                </div>

                

                <div className="items-end text-right max-h-[50vh] border-2 border-gray-400 w-full">
                    <h1>Properties</h1>
                </div>
            
            </div>
            <div className="flex flex-col items-center justify-center w-full select-none">
                <div className="relative flex flex-col w-[95vw] bg-white h-5 my-5">
                    <input
                    onChange={updatePlayhead}
                    id="playhead"
                    type="range"
                    defaultValue="1"
                    min="0"
                    max="100"
                    step="0.01"
                    className="opacity-0 absolute w-[95vw] bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    ></input>

                    <div
                    id="playheadDiv"
                    className={`relative top-0 left-0 right-0 bottom-0 flex flex-col items-center bg-slate-800 w-6 py-2 my-auto`}
                    >
                    {/* Your content goes here */}
                    </div>
                </div>


                <div id="timelineRows" className="flex flex-col items-center w-[95vw]">

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
