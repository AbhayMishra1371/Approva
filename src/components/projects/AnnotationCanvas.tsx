"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Crosshair } from 'lucide-react';

export type Annotation = {
    $id?: string;
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
    currentColor: string; // The color currently selected for new annotations
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
    assetUrl,
    assetType,
    annotations,
    onAddAnnotation,
    onSelectAnnotation,
    selectedAnnotationId,
    currentColor
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    // Zoom & Pan State
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

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode === 'pan') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }

        if (!innerRef.current) return;

        // Use innerRef to get precise coordinates relative to the scaled/panned content
        const rect = innerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentRect({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (mode === 'pan' && isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
            return;
        }

        if (!isDrawing || !innerRef.current) return;

        const rect = innerRef.current.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;

        const width = currentX - startPos.x;
        const height = currentY - startPos.y;

        setCurrentRect({
            x: width < 0 ? currentX : startPos.x,
            y: height < 0 ? currentY : startPos.y,
            width: Math.abs(width),
            height: Math.abs(height)
        });
    };

    const handleMouseUp = () => {
        if (mode === 'pan') {
            setIsPanning(false);
            return;
        }

        if (!isDrawing || !currentRect) return;

        setIsDrawing(false);

        // Require a minimum size (e.g., 0.5% of the container) to prevent accidental clicks
        const MIN_SIZE = 0.5;
        if (currentRect.width > MIN_SIZE && currentRect.height > MIN_SIZE) {
            onAddAnnotation({
                ...currentRect,
                color: currentColor
            });
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

                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    {/* Existing Annotations */}
                    {annotations.map((ann, index) => (
                        <g
                            key={ann.$id || index}
                            className={`pointer-events-auto ${mode === 'annotate' ? 'cursor-pointer' : ''}`}
                            onClick={(e) => {
                                if (mode === 'pan') return;
                                e.stopPropagation();
                                onSelectAnnotation(ann);
                            }}
                        >
                            <rect
                                x={ann.x}
                                y={ann.y}
                                width={ann.width}
                                height={ann.height}
                                fill={selectedAnnotationId === ann.$id
                                    ? (ann.status === 'resolved' ? 'rgba(148, 163, 184, 0.2)' : `${ann.color}40`)
                                    : 'transparent'}
                                stroke={ann.status === 'resolved' ? '#94a3b8' : ann.color}
                                strokeWidth={0.5 / scale} // Keep stroke width visually consistent
                                className={`transition-all hover:fill-[${ann.color}20] ${selectedAnnotationId === ann.$id ? 'stroke-[1.2] drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]' : 'hover:stroke-[0.8]'}`}
                                style={{
                                    strokeWidth: (selectedAnnotationId === ann.$id ? 1.2 : 0.5) / scale,
                                    fill: selectedAnnotationId === ann.$id
                                        ? (ann.status === 'resolved' ? 'rgba(148, 163, 184, 0.2)' : `${ann.color}4D`)
                                        : undefined
                                }}
                            />
                            {ann.status === 'pending' && (
                                <circle
                                    cx={ann.x}
                                    cy={ann.y}
                                    r={0.8 / scale} // Keep pulse circle size visually consistent
                                    fill={ann.color}
                                    className="animate-pulse"
                                />
                            )}
                        </g>
                    ))}

                    {/* Current Drawing */}
                    {currentRect && mode === 'annotate' && (
                        <rect
                            x={currentRect.x}
                            y={currentRect.y}
                            width={currentRect.width}
                            height={currentRect.height}
                            fill={`${currentColor}33`}
                            stroke={currentColor}
                            strokeWidth={0.5 / scale}
                            strokeDasharray="1,1"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
};
