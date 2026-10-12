import { type CreatorState, useLocalNodes } from '@react-three/fiber/webgpu'
import { FC, useCallback } from 'react'
import { color, mix, mx_noise_float, screenUV, time } from 'three/tsl'

const BackgroundNode: FC = () => {
  const createBackgroundNode = useCallback((_: CreatorState) => {
    // Your custom TSL shader logic goes here
    const noise = mx_noise_float(screenUV.mul(2.0).add(time)).mul(0.5).add(0.5) // Example noise function
    const backgroundNode = mix(color('red'), color('blue'), noise)

    return {
      backgroundNode,
    }
  }, [])

  const { backgroundNode } = useLocalNodes(createBackgroundNode)

  return <primitive attach="backgroundNode" object={backgroundNode} />
}

export default BackgroundNode
