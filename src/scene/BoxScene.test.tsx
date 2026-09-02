import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createInitialProject } from '../app/projectReducer'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useThree: (selector: (state: {
    gl: object
    scene: object
    camera: object
  }) => unknown) => selector({ gl: {}, scene: {}, camera: {} }),
}))

vi.mock('@react-three/drei', () => ({
  ContactShadows: () => <div data-testid="product-contact-shadow" />,
  OrbitControls: () => null,
}))

vi.mock('./PrintedBox', () => ({ PrintedBox: () => null }))
vi.mock('../pouch/PrintedPouch', () => ({ PrintedPouch: () => null }))
vi.mock('../innerPackaging/PrintedInnerPackaging1', () => ({ PrintedInnerPackaging1: () => null }))
vi.mock('../innerPackaging/PrintedInnerPackaging2', () => ({ PrintedInnerPackaging2: () => null }))
vi.mock('../hangingTissue/PrintedHangingTissue', () => ({
  PrintedHangingTissue: () => <div data-testid="printed-hanging-tissue" />,
}))
vi.mock('../faceTissue/PrintedFaceTissue', () => ({
  PrintedFaceTissue: () => <div data-testid="printed-face-tissue" />,
}))
vi.mock('../wetTissue/PrintedWetTissue', () => ({
  PrintedWetTissue: () => <div data-testid="printed-wet-tissue" />,
}))
vi.mock('../washTissue/PrintedWashTissue', () => ({
  PrintedWashTissue: () => <div data-testid="printed-wash-tissue" />,
}))
vi.mock('./StudioEnvironment', () => ({ StudioEnvironment: () => null }))

import { BoxScene } from './BoxScene'

describe('BoxScene', () => {
  it('renders a contact shadow directly below the packaging model', () => {
    render(<BoxScene project={createInitialProject()} command={null} />)

    expect(screen.getByTestId('product-contact-shadow')).toBeInTheDocument()
  })

  it('renders the hanging tissue model for the hanging tissue packaging type', () => {
    const project = createInitialProject()
    project.packagingType = 'hanging-tissue'

    render(<BoxScene project={project} command={null} />)

    expect(screen.getByTestId('printed-hanging-tissue')).toBeInTheDocument()
  })

  it('renders the face tissue model for the face tissue packaging type', () => {
    const project = createInitialProject()
    project.packagingType = 'face-tissue'

    render(<BoxScene project={project} command={null} />)

    expect(screen.getByTestId('printed-face-tissue')).toBeInTheDocument()
  })

  it('renders the wet tissue model for the wet tissue packaging type', () => {
    const project = createInitialProject()
    project.packagingType = 'wet-tissue'

    render(<BoxScene project={project} command={null} />)

    expect(screen.getByTestId('printed-wet-tissue')).toBeInTheDocument()
  })

  it('renders the wash tissue model for the wash tissue packaging type', () => {
    const project = createInitialProject()
    project.packagingType = 'wash-tissue'

    render(<BoxScene project={project} command={null} />)

    expect(screen.getByTestId('printed-wash-tissue')).toBeInTheDocument()
  })
})
