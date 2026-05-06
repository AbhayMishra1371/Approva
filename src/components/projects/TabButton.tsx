import React from "react";

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

export function TabButton({
    active,
    onClick,
    icon,
    label
}: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors text-sm font-medium ${active
                ? "border-purple-500 rounded-md  text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
