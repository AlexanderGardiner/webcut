"use client"
import { transform } from "next/dist/build/swc";
import React, { useState, useEffect } from "react";
import { FaPlay } from "react-icons/fa";

export default function Home() {
    let previewCanvas: HTMLCanvasElement;
    let previewCTX: CanvasRenderingContext2D;
    let playhead: HTMLInputElement;
    let mediaPool: HTMLDivElement | null = null;
    let playheadDiv: HTMLDivElement;
    let fps = 60;
    let timelineRows: TimelineRow[] = [];
    let timelineRowsElement: HTMLDivElement;
    let playing = false;
    let currentTime: number;
    let previousTime: number; 
    let timelineTime:number = 0;
    let test = 0;

    useEffect(() => {    
        previewCanvas = document.getElementById("previewCanvas") as HTMLCanvasElement;
        previewCTX = previewCanvas.getContext("2d") as CanvasRenderingContext2D;
        playhead = document.getElementById("playhead") as HTMLInputElement;
        mediaPool = document.getElementById("mediaPool") as HTMLDivElement;
        timelineRowsElement = document.getElementById("timelineRows") as HTMLDivElement;
        playheadDiv = document.getElementById("playheadDiv") as HTMLDivElement;
        
        timelineRows.push(new TimelineRow(test));
        test+=1;
        playheadDiv.style.position = "relative";
        playheadDiv.style.width = "6px";
        
    }, []);
    
    class TimelineRow {
        videos: TimelineVideo[];
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
        addVideo(timelineVideo: TimelineVideo) {
            this.videos.push(timelineVideo);
            step();
        }

    }

    class TimelineVideo {
        inPoint: number;
        startPoint: number;
        endPoint: number;
        video: HTMLVideoElement;
        ui: HTMLDivElement;
        timelineRowId: number;
        previewImage: HTMLImageElement;
        transform: Transform;
        leftSelect: HTMLButtonElement;
        rightSelect: HTMLButtonElement;
        constructor(inPoint: number, startPoint: number, endPoint: number, timelineRowId: number, video: HTMLVideoElement, transform: Transform) {
            this.inPoint = inPoint;
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
            this.previewImage.className = "absolute w-full overflow-hidden h-full pointer-events-auto"
            this.previewImage.setAttribute("style","top:0px;");
            this.ui.appendChild(this.previewImage);
            timelineRows[timelineRowId].ui.appendChild(this.ui);
            this.ui.setAttribute("style", `
                width: ${(timelineRows[timelineRowId].ui.clientWidth * (this.video.duration) / 100).toString()}px; 
                left: ${(timelineRows[timelineRowId].ui.clientWidth * (startPoint) / 100).toString()}px;
                top: 0px;
            `);
            this.leftSelect = document.createElement("button");
            this.leftSelect.className = "absolute flex bg-slate-100 w-[5px] py-0 bg-white h-10 px-0 pointer-events-auto";
            this.leftSelect.setAttribute("style", `
                top: 0px;
                z-index: 3;
            `);
            this.leftSelect.addEventListener('mousedown', this.startInPointAdjustment.bind(this));

            this.rightSelect = document.createElement("button");
            this.rightSelect.className = "absolute flex bg-slate-100 w-[5px] py-0 bg-white h-10 px-0 pointer-events-auto";
            this.rightSelect.setAttribute("style", `
                top: 0px;
                right: 0px;
                z-index: 3;
            `);
            this.rightSelect.addEventListener('mousedown', this.startEndPointAdjustment.bind(this));

            this.previewImage.addEventListener('mousedown', this.dragVideo.bind(this));
            this.ui.appendChild(this.leftSelect);
            this.ui.appendChild(this.rightSelect);
            this.transform = transform;
        }

        updatePreviewImage() {
            this.ui.setAttribute("style", `
                width: ${(timelineRows[this.timelineRowId].ui.clientWidth * (this.endPoint - this.startPoint) / 100).toString()}px; 
                left: ${(timelineRows[this.timelineRowId].ui.clientWidth * (this.startPoint) / 100).toString()}px;
                top: 0px;
            `);
        }

        dragVideo(event: MouseEvent) {
            event.preventDefault();
            console.log("dragVideo triggered");
            console.log(event);
            var videoRect = this.ui.getBoundingClientRect();
            let initalMousePosition = (this.endPoint - this.startPoint) * (event.clientX - videoRect.left) / videoRect.width;
            let width = (this.endPoint - this.startPoint);
        
            const handleMouseUp = (e: MouseEvent) => {
                console.log("MouseUp event triggered");
                console.log(this);
                document.body.removeEventListener("mouseup", handleMouseUp);
                document.body.removeEventListener("mousemove", handleMouseMove);
            };
        
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault();
                console.log("MouseMove event triggered");
                
                
                var timelineRowRect = timelineRows[this.timelineRowId].ui.getBoundingClientRect();
                var x = 100 * (e.clientX - timelineRowRect.left) / timelineRows[this.timelineRowId].ui.clientWidth;
                if (x < this.endPoint && x >= this.endPoint - this.video.duration) {
                    this.startPoint = x - initalMousePosition;
                    this.endPoint = this.startPoint + width;
                    
                }
                
                
                this.updatePreviewImage();
            };
        
            document.body.addEventListener("mouseup", handleMouseUp, true);
            document.body.addEventListener("mousemove", handleMouseMove);
        }

        startInPointAdjustment(event: MouseEvent) {
            event.preventDefault();
            console.log("startInPointAdjustment triggered");
            console.log(event);
        
            const handleMouseUp = (e: MouseEvent) => {
                console.log("MouseUp event triggered");
                console.log(this);
                document.body.removeEventListener("mouseup", handleMouseUp);
                document.body.removeEventListener("mousemove", handleMouseMove);
            };
        
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault();
                console.log("MouseMove event triggered");
                var timelineRowRect = timelineRows[this.timelineRowId].ui.getBoundingClientRect();
                var x = 100 * (e.clientX - timelineRowRect.left) / timelineRows[this.timelineRowId].ui.clientWidth;
                if (x < this.endPoint && x >= this.endPoint - this.video.duration) {
                    this.inPoint += x - this.startPoint;
                    this.startPoint = x;
                    
                }
                
                
                this.updatePreviewImage();
            };
        
            document.body.addEventListener("mouseup", handleMouseUp, true);
            document.body.addEventListener("mousemove", handleMouseMove);
        }

        startEndPointAdjustment(event: MouseEvent) {
            event.preventDefault();
            console.log("startOutPointAdjustment triggered");
            console.log(event);
        
            const handleMouseUp = (e: MouseEvent) => {
                console.log("MouseUp event triggered");
                console.log(this);
                document.body.removeEventListener("mouseup", handleMouseUp);
                document.body.removeEventListener("mousemove", handleMouseMove);
            };
        
            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault();
                console.log("MouseMove event triggered");
                var timelineRowRect = timelineRows[this.timelineRowId].ui.getBoundingClientRect();
                var x = 100 * (e.clientX - timelineRowRect.left) / timelineRows[this.timelineRowId].ui.clientWidth;
                if (x - this.startPoint <= this.video.duration && x > this.startPoint) {
                    this.endPoint = x;
                }
                
                
                this.updatePreviewImage();
            };
        
            document.body.addEventListener("mouseup", handleMouseUp, true);
            document.body.addEventListener("mousemove", handleMouseMove);
        }

        
    }

    class Transform {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        constructor(x: number, y: number, width: number, height: number, rotation: number) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.rotation = rotation;
        }
    }
    
    

    

    function step() {
        playheadDiv.style.left = (timelineRows[0].ui.clientWidth * (timelineTime)/100).toString()+"px";
        currentTime = performance.now();
        previewCTX.clearRect(0,0, previewCanvas.width, previewCanvas.height);
        if (playing) {
            timelineTime += (currentTime-previousTime)/1000;
            playhead.value = timelineTime.toString();
        }
        
        for (let i=timelineRows.length-1; i>=0; i--) {
            for (let j=0; j<timelineRows[i].videos.length; j++) {
                // Funky stuff happening here
                if (timelineRows[i].videos[j].startPoint<=timelineTime+1 && timelineRows[i].videos[j].endPoint>=timelineTime) {
                    let centerX = timelineRows[i].videos[j].transform.x + timelineRows[i].videos[j].transform.width/2;
                    let centerY = timelineRows[i].videos[j].transform.y + timelineRows[i].videos[j].transform.height/2;
                    
                    previewCTX.translate(centerX, centerY);                    
                    previewCTX.rotate(timelineRows[i].videos[j].transform.rotation);
                    previewCTX.translate(-centerX, -centerY);                    

                    if (!playing && timelineRows[i].videos[j].video.currentTime!=timelineTime - timelineRows[i].videos[j].startPoint + timelineRows[i].videos[j].inPoint) {
                        timelineRows[i].videos[j].video.currentTime = timelineTime - timelineRows[i].videos[j].startPoint + timelineRows[i].videos[j].inPoint;
                        timelineRows[i].videos[j].video.play();
                    }
                    if (playing && timelineRows[i].videos[j].video.paused) {
                        console.log("attempting to play")
                        timelineRows[i].videos[j].video.currentTime = timelineTime - timelineRows[i].videos[j].startPoint + timelineRows[i].videos[j].inPoint;
                        timelineRows[i].videos[j].video.play();

                        
                    }  
                    previewCTX.drawImage(
                        timelineRows[i].videos[j].video,
                        timelineRows[i].videos[j].transform.x,
                        timelineRows[i].videos[j].transform.y,
                        timelineRows[i].videos[j].transform.width,
                        timelineRows[i].videos[j].transform.height
                        );
                } else {
                    timelineRows[i].videos[j].video.pause();
                }
                previewCTX.setTransform(1, 0, 0, 1, 0, 0);
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
        setTimeout(() => {
            step();
        }, 30);//requestAnimationFrame(step);
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
                width: ${(timelineRows[0].ui.clientWidth * (video.duration) / 100).toString()}px; 
                left: 0px;
            `);
        document.body.appendChild(tempVideoImage);
        
        tempVideoImage.className = "h-10 absolute pointer-events-none";
        const handleMouseMove = (e: MouseEvent) => {
            console.log("handle mouse move")
            e.preventDefault();
            updateDraggedVideoPosition(e, tempVideoImage);
          };

        const handleMouseUp = (e: MouseEvent) => {
            console.log("handle mouse up")
            e.preventDefault();
            document.body.removeEventListener("mousemove", handleMouseMove);
            document.body.removeEventListener("mouseup", handleMouseUp);
            tempVideoImage.removeAttribute("src");
            tempVideoImage.remove();
            for (let i=0; i<timelineRows.length; i++) {
                timelineRows[i].ui.removeEventListener('mouseup', handleMouseUpOnTimeline);
            }
          };
      
        const handleMouseUpOnTimeline = (e: MouseEvent) => {
            console.log("mouseup on timeline")
            console.log("handle mouse up on timeline")
            e.preventDefault();
            let target = e.target as HTMLDivElement;
            if (target.getAttribute("timelineRowId")!=null) {
                endDragVideo(e, tempVideoImage, parseInt(target.getAttribute("timelineRowId")!), video);
            } else {
                handleMouseUp(e);
            }
            
            for (let i=0; i<timelineRows.length; i++) {
                timelineRows[i].ui.removeEventListener('mouseup', handleMouseUpOnTimeline);
            }
            document.body.removeEventListener("mousemove", handleMouseMove);
            document.body.removeEventListener("mouseup", handleMouseUp);
        }
        document.body.addEventListener("mousemove", handleMouseMove);
        document.body.addEventListener("mouseup", handleMouseUp);
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
            if (timelineRows[i].videos[j].startPoint<x+originalVideo.duration && timelineRows[i].videos[j].endPoint>x) {
                canAddVideo = false;
            }
        }
        if (canAddVideo) {
            timelineRows[i].addVideo(new TimelineVideo(0,x,x+originalVideo.duration,i,originalVideo, new Transform(0,0,previewCanvas.width,previewCanvas.height,Math.random()*2*Math.PI)));

        }

        tempVideo.removeAttribute("src");
        tempVideo.remove();
    }

    

    function updatePlayhead(e: React.ChangeEvent<HTMLInputElement>) {
        playing = false;

        timelineTime = parseFloat(e.target.value);
        
        playheadDiv.style.left = (timelineRows[0].ui.clientWidth * (timelineTime)/100).toString()+"px";
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
                    className="absolute w-[100vw] bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
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
