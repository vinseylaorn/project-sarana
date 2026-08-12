
"use client"

import { useState, useRef, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { ZoomOut, ZoomIn, RotateCcw, Crop, Check } from "lucide-react"
import { SORA } from "./menu.config"

const CROP_SIZE = 320

interface Props {
  src: string | null
  open: boolean
  onDone: (v: string) => void
  onCancel: () => void
}

export function MenuImageCropDialog({ src, open, onDone, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!src) return
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imgRef.current = img
      const s = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height)
      setScale(s)
      setOffset({ x: (CROP_SIZE - img.width * s) / 2, y: (CROP_SIZE - img.height * s) / 2 })
    }
    img.src = src
  }, [src])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")
    const img = imgRef.current
    if (!ctx || !img) return
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale)
  }, [scale, offset])

  const resetView = () => {
    const img = imgRef.current
    if (!img) return
    const s = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height)
    setScale(s)
    setOffset({ x: (CROP_SIZE - img.width * s) / 2, y: (CROP_SIZE - img.height * s) / 2 })
  }

  const cornerClass = (i: number) => {
    const pos = ["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"][i]
    const radius = [
      "rounded-tl-lg border-r-0 border-b-0",
      "rounded-tr-lg border-l-0 border-b-0",
      "rounded-bl-lg border-r-0 border-t-0",
      "rounded-br-lg border-l-0 border-t-0",
    ][i]
    return `absolute w-4 h-4 border-2 border-violet-400 ${pos} ${radius}`
  }
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent
        className="max-w-[420px] p-0 border border-gray-200 dark:border-white/[0.10] shadow-lg rounded-3xl bg-white dark:bg-[#1e2235] [&>button]:hidden"
        style={SORA} >
        <DialogHeader className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#22263a] rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Crop className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div>
              <DialogTitle className="text-[13px] font-bold text-gray-800 dark:text-white/90">Crop Image</DialogTitle>
              <DialogDescription className="text-[10px] text-gray-400 dark:text-white/30 font-medium">
                ទំហំ: <span className="text-violet-500 font-bold">320 X 320 px (1:1)</span> · Drag to reposition
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-5 space-y-3">
          <div
            className="relative rounded-xl overflow-hidden border-2 border-violet-300 dark:border-violet-500/40 cursor-grab active:cursor-grabbing mx-auto bg-gray-100 dark:bg-gray-800"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onMouseDown={e => {
              setDragging(true)
              dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
            }}
            onMouseMove={e => {
              if (dragging)
                setOffset({ x: dragStart.current.ox + e.clientX - dragStart.current.x, y: dragStart.current.oy + e.clientY - dragStart.current.y })
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)} >
            <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/10" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-white/10" />
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/10" />
              <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/10" />
              {[0, 1, 2, 3].map(i => <div key={i} className={cornerClass(i)} />)}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-white/25 text-center font-medium">
            Drag ដើម្បីផ្លាស់ទី · Scroll ដើម្បី Zoom
          </p>
          <div className="flex items-center gap-2">
            {[
              { icon: ZoomOut, fn: () => setScale(s => Math.max(0.3, s - 0.1)) },
              { icon: ZoomIn, fn: () => setScale(s => Math.min(3, s + 0.1)) },
              { icon: RotateCcw, fn: resetView },
            ].map(({ icon: Icon, fn }, i) => (
              <button
                key={i} onClick={fn}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.07] text-gray-500 dark:text-white/40 transition-all" >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
            <input
              type="range" min={0.3} max={3} step={0.01} value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className="flex-1 accent-violet-600 cursor-pointer"
            />
          </div>
        </div>
        <DialogFooter className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-9 px-5 rounded-xl text-[12px] font-bold border border-gray-200 dark:border-white/[0.10] text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all" >
            Cancel
          </button>
          <button
            onClick={() => onDone(canvasRef.current!.toDataURL("image/png"))}
            className="h-9 px-5 rounded-xl text-[12px] font-bold bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 transition-all" >
            <Check className="w-3.5 h-3.5" /> Apply Crop
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}