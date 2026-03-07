"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Crosshair } from 'lucide-react';

export type Annotation = {
    $id?: string;
    name?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'pending' | 'resolved';
    color: string;
    created_at: string;
};

interface AnnotationCanvasProps {
    assetUrl: string;
    assetType: string;
    annotations: Annotation[];
    onAddAnnotation: (annotation: Omit<Annotation, 'created_at' | 'status'>) => void;
    onSelectAnnotation: (annotation: Annotation) => void;
    selectedAnnotationId?: string;
    currentColor: string;
    renderPopup?: (annotation: Annotation) => React.ReactNode;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
    assetUrl,
    assetType,
    annotations,
    onAddAnnotation,
    onSelectAnnotation,
    selectedAnnotationId,
    currentColor,
    renderPopup
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [draftPin, setDraftPin] = useState<{ x: number, y: number } | null>(null);
    const [draftName, setDraftName] = useState("New Annotation");


    const [mode, setMode] = useState<'annotate' | 'pan'>('annotate');
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleResetZoom = () => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
        }
    }, []);

    const getCoordinatesFromEvent = (e: React.MouseEvent): { x: number, y: number } | null => {
        if (!innerRef.current) return null;

        const container = innerRef.current;
        const rect = container.getBoundingClientRect();

        let actualLeft = rect.left;
        let actualTop = rect.top;
        let actualWidth = rect.width;
        let actualHeight = rect.height;


        const img = container.querySelector('img');
        if (img) {
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const containerRatio = rect.width / rect.height;

            if (imgRatio > containerRatio) {

                actualHeight = rect.width / imgRatio;
                actualTop = rect.top + (rect.height - actualHeight) / 2;
            } else {

                actualWidth = rect.height * imgRatio;
                actualLeft = rect.left + (rect.width - actualWidth) / 2;
            }
        }


        if (e.clientX < actualLeft || e.clientX > actualLeft + actualWidth ||
            e.clientY < actualTop || e.clientY > actualTop + actualHeight) {
            return null;
        }

        const x = ((e.clientX - actualLeft) / actualWidth) * 100;
        const y = ((e.clientY - actualTop) / actualHeight) * 100;

        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (draftPin) {
            // Dismiss draft pin if clicking outside
            setDraftPin(null);
            return;
        }

        if (mode === 'pan') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }

        const coords = getCoordinatesFromEvent(e);
        if (!coords) return;

        setIsDrawing(true);
        setStartPos(coords);
        setCurrentRect({ ...coords, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (mode === 'pan' && isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
            return;
        }

        if (!isDrawing) return;

        const coords = getCoordinatesFromEvent(e);
        if (!coords) return;

        const width = coords.x - startPos.x;
        const height = coords.y - startPos.y;

        setCurrentRect({
            x: width < 0 ? coords.x : startPos.x,
            y: height < 0 ? coords.y : startPos.y,
            width: Math.abs(width),
            height: Math.abs(height)
        });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (mode === 'pan') {
            setIsPanning(false);
            return;
        }

        if (!isDrawing) return;
        setIsDrawing(false);

        const coords = getCoordinatesFromEvent(e);
        if (!coords) {
            setCurrentRect(null);
            return;
        }

        // If distance moved is very small, treat as a click to place a pin
        const distance = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));

        if (distance < 2) {
            setDraftPin(startPos);
            setDraftName("New Annotation");
        }

        setCurrentRect(null);
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full bg-black/20 rounded-lg overflow-hidden group ${mode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                <div className="flex bg-[#12131a]/80 backdrop-blur-md border border-[#2a2b36] rounded-lg p-1 shadow-xl">
                    <button
                        onClick={() => setMode('annotate')}
                        className={`p-1.5 rounded-md transition-colors ${mode === 'annotate' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        title="Annotate Mode (Draw)"
                    >
                        <Crosshair className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setMode('pan')}
                        className={`p-1.5 rounded-md transition-colors ${mode === 'pan' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        title="Pan Mode (Move)"
                    >
                        <MousePointer2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center bg-[#12131a]/80 backdrop-blur-md border border-[#2a2b36] rounded-lg p-1 shadow-xl">
                    <button onClick={handleZoomOut} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors" title="Zoom Out">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-xs font-medium text-slate-300">
                        {Math.round(scale * 100)}%
                    </span>
                    <button onClick={handleZoomIn} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors" title="Zoom In">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-[#2a2b36] mx-1"></div>
                    <button onClick={handleResetZoom} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors" title="Reset/Fit">
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Inner scaled/panned container */}
            <div
                ref={innerRef}
                className="absolute inset-0 w-full h-full origin-center transition-transform duration-75"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`
                }}
            >
                {assetType.startsWith('video/') ? (
                    <video
                        src={assetUrl}
                        className="w-full h-full object-contain pointer-events-none"
                    />
                ) : (
                    <img
                        src={assetUrl}
                        alt="Asset"
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                    />
                )}

                {/* HTML Annotations Overlay */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {annotations.map((ann, index) => (
                        <div
                            key={ann.$id || index}
                            className={`absolute pointer-events-auto ${mode === 'annotate' ? 'cursor-pointer' : ''}`}
                            style={{ left: `${ann.x}%`, top: `${ann.y}%`, zIndex: selectedAnnotationId === ann.$id ? 50 : 10 }}
                            onClick={(e) => {
                                if (mode === 'pan') return;
                                e.stopPropagation();
                                onSelectAnnotation(ann);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                        >
                            <div style={{ transform: `scale(${1 / scale})`, transformOrigin: 'top left' }}>
                                {/* Pin Marker */}
                                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xl border-[2px] transition-transform ${selectedAnnotationId === ann.$id ? 'border-white scale-125' : 'border-[#12131a] hover:scale-110'}`}
                                        style={{ backgroundColor: ann.color || currentColor }}
                                    >
                                        {index + 1}
                                    </div>
                                    {ann.name && selectedAnnotationId !== ann.$id && (
                                        <div className="mt-1.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-white text-[10px] whitespace-nowrap border border-white/10 shadow-lg pointer-events-none">
                                            {ann.name}
                                        </div>
                                    )}
                                </div>

                                {/* Popover */}
                                {selectedAnnotationId === ann.$id && renderPopup && (
                                    <div className="absolute top-1/2 -translate-y-1/2 left-full ml-4 z-[100]">
                                        {renderPopup(ann)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Draft Pin Overlay */}
                    {draftPin && (
                        <div
                            className="absolute pointer-events-auto"
                            style={{ left: `${draftPin.x}%`, top: `${draftPin.y}%`, zIndex: 60 }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ transform: `scale(${1 / scale})`, transformOrigin: 'top left' }}>
                                {/* Pin Marker */}
                                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xl border-[2px] border-white scale-125 transition-transform"
                                        style={{ backgroundColor: currentColor }}
                                    >
                                        +
                                    </div>
                                </div>

                                {/* Naming Popover */}
                                <div className="absolute top-1/2 -translate-y-1/2 left-full ml-4 z-[100]">
                                    <div className="bg-[#1e1f2b]/95 backdrop-blur-xl border border-[#2a2b36] p-3 rounded-xl shadow-2xl w-64 animate-in fade-in zoom-in-95 duration-200">
                                        <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">Name annotation</label>
                                        <div className="flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={draftName}
                                                onChange={(e) => setDraftName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && draftName.trim()) {
                                                        onAddAnnotation({
                                                            x: draftPin.x,
                                                            y: draftPin.y,
                                                            width: 0,
                                                            height: 0,
                                                            name: draftName.trim(),
                                                            color: currentColor
                                                        });
                                                        setDraftPin(null);
                                                    } else if (e.key === 'Escape') {
                                                        setDraftPin(null);
                                                    }
                                                }}
                                                className="flex-1 min-w-0 bg-[#12131a] border border-[#2a2b36] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (draftName.trim()) {
                                                        onAddAnnotation({
                                                            x: draftPin.x,
                                                            y: draftPin.y,
                                                            width: 0,
                                                            height: 0,
                                                            name: draftName.trim(),
                                                            color: currentColor
                                                        });
                                                        setDraftPin(null);
                                                    }
                                                }}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
