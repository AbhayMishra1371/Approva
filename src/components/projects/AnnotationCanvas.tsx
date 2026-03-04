"use client";

import React, { useState, useRef, useEffect } from 'react';

export type Annotation = {
    $id?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'pending' | 'resolved';
    created_at: string;
};

interface AnnotationCanvasProps {
    assetUrl: string;
    assetType: string;
    annotations: Annotation[];
    onAddAnnotation: (annotation: Omit<Annotation, 'created_at' | 'status'>) => void;
    onSelectAnnotation: (annotation: Annotation) => void;
    selectedAnnotationId?: string;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
    assetUrl,
    assetType,
    annotations,
    onAddAnnotation,
    onSelectAnnotation,
    selectedAnnotationId
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentRect({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
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
        if (!isDrawing || !currentRect) return;

        setIsDrawing(false);

        // Require a minimum size (e.g., 0.5% of the container) to prevent accidental clicks
        const MIN_SIZE = 0.5;
        if (currentRect.width > MIN_SIZE && currentRect.height > MIN_SIZE) {
            onAddAnnotation(currentRect);
        }

        setCurrentRect(null);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black/20 rounded-lg overflow-hidden cursor-crosshair group"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {assetType.startsWith('video/') ? (
                <video
                    src={assetUrl}
                    className="w-full h-full object-contain"
                    controls
                />
            ) : (
                <img
                    src={assetUrl}
                    alt="Asset"
                    className="w-full h-full object-contain pointer-events-none"
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
                        className="pointer-events-auto cursor-pointer"
                        onClick={(e) => {
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
                                ? (ann.status === 'resolved' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(168, 85, 247, 0.3)')
                                : 'transparent'}
                            stroke={ann.status === 'resolved' ? '#94a3b8' : '#a855f7'}
                            strokeWidth="0.5"
                            className={`transition-all hover:fill-[rgba(168,85,247,0.15)] ${selectedAnnotationId === ann.$id ? 'stroke-[1.2] drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'hover:stroke-[0.8]'}`}
                        />
                        {ann.status === 'pending' && (
                            <circle
                                cx={ann.x}
                                cy={ann.y}
                                r="0.8"
                                fill="#a855f7"
                                className="animate-pulse"
                            />
                        )}
                    </g>
                ))}

                {/* Current Drawing */}
                {currentRect && (
                    <rect
                        x={currentRect.x}
                        y={currentRect.y}
                        width={currentRect.width}
                        height={currentRect.height}
                        fill="rgba(168, 85, 247, 0.2)"
                        stroke="#a855f7"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                    />
                )}
            </svg>
        </div>
    );
};
