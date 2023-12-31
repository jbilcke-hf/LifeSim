"use client"

import { useEffect, useRef, useState, useTransition } from "react"

import { VideoRenderer } from "@/components/business/video-renderer"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { render } from "./render"
import { Agent, AgentType, Scene } from "./agents/types"
import { agents, defaultAgent, getAgent } from "./agents"
import { ImageSegment } from "./types"

export default function Main() {
  const [url, setUrl] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [scene, setScene] = useState<Scene>()
  const [segments, setSegments] = useState<ImageSegment[]>([])
  const ref = useRef<AgentType>(defaultAgent)
   
  useEffect(() => {
    
    const updateView = async () => {
      // console.log(`update view..`)

      await startTransition(async () => {

        // console.log(`getting agent..`)
        const type = ref?.current
        const agent = getAgent(type)

        // console.log(`asking agent to determine things..`)
        const scene = agent.simulate()

        // console.log(`rendering scene..`)
        const rendered = await render(
          scene.prompt,

          []
          // note: using actionnables will add +30sec to the query
          // scene.actionnables.slice(0, 5) // too many can slow us down it seems
        )

        if (type !== ref?.current) {
          console.log("agent type changed! reloading scene")
          setTimeout(() => { updateView() }, 0)
          return
        } 


        if (rendered.assetUrl) {
          // console.log(`got a new url: ${newUrl}`)
          setUrl(rendered.assetUrl)
          setScene(scene)
          setSegments(rendered.segments)
          setTimeout(() => { updateView()}, 1000)
        } else {
          // console.log(`going to wait a bit more: ${newUrl}`)
          setTimeout(() => { updateView()}, rendered.error ? 6000 : 3000)
        }
      })
    }

    updateView()

  }, [])

  return (
    <div className="flex flex-col w-full pt-4">
      <div className="flex flex-col space-y-3 px-2">
        <div className="flex flex-row items-center space-x-3">
          <label className="flex">Agent model:</label>
          <Select
            defaultValue={defaultAgent}
            onValueChange={(value) => {
              ref.current = value as AgentType
              setUrl("")
            }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(agents).map(([key, agent]) =>
              <SelectItem key={key} value={key}>{agent.title}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <p>Note: changing the model might take up to 1 minute</p>
          
        {(scene) ? <div>
          <p>Action: {scene.action}</p>
          <p>Position: {scene.position}</p>
          <p>Light: {scene.light}</p>
        </div> : null}
        <div className="flex flex-col">
        {segments.map((segment, i) => 
          <div key={i}>
            {segment.label} ({segment.score})
          </div>)}
        </div>
      </div>
      <VideoRenderer url={url} />
    </div>
  )
}