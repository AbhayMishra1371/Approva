"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      icons={{
        success: (
          <CircleCheckIcon className="size-5 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-500" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-rose-500" />
        ),
        loading: (
          <Loader2Icon className="size-5 text-purple-500 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-[#12131a] border border-[#2a2b36] shadow-xl text-white rounded-xl font-sans",
          description: "text-slate-400 text-sm",
          actionButton:
            "bg-purple-500 hover:bg-purple-600 transition-colors text-white",
          cancelButton:
            "bg-[#1e1f2b] hover:bg-[#2a2b36] transition-colors text-slate-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
