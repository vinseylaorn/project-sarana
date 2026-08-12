"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

function AnimatedNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const spring = useSpring(0, { mass: 1, stiffness: 60, damping: 15 })
  
  const display = useTransform(spring, (current) => {
    if (isCurrency) {
      return "$" + current.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    }
    return Math.floor(current).toLocaleString()
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <div style={{ display: "inline-flex", overflow: "hidden" }}>
      <motion.span
        initial={{ x: "-100%", opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ display: "inline-block" }}
      >
        <motion.span>{display}</motion.span>
      </motion.span>
    </div>
  )
}