import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createInitialProject, getSelectedInstance } from '../app/projectReducer'
import { getExportPreset } from '../export/exportFrame'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useThree: (selector: (state: {
    gl: object
    scene: object
    camera: object
    size: { width: number; height: number }
  }) => unknown) => selector({ gl: {}, scene: {}, camera: {}, size: { width: 1000, height: 1000 } }),
}))

vi.mock('@react-three/drei', () => ({
  ContactShadows: () => <div data-testid="product-contact-shadow" />,
  OrbitControls: () => null,
  RoundedBox: ({ children, name }: { children: React.ReactNode; name: string }) => <mesh name={name}>{children}</mesh>,
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
vi.mock('../composition/PackageInstanceView', () => ({
  PackageInstanceView: ({ instance }: { instance: { packagingType: string } }) => {
    const testId = {
      'hanging-tissue': 'printed-hanging-tissue',
      'face-tissue': 'printed-face-tissue',
      'wet-tissue': 'printed-wet-tissue',
      'wash-tissue': 'printed-wash-tissue',
    }[instance.packagingType]
    return testId ? <div data-testid={testId} /> : null
  },
}))
vi.mock('./StudioEnvironment', () => ({ StudioEnvironment: () => null }))

import { BoxScene } from './BoxScene'

const defaultExportPreset = getExportPreset('square-standard')

describe('BoxScene', () => {
  it('renders a contact shadow directly below the packaging model', () => {
    render(<BoxScene project={createInitialProject()} command={null} exportPreset={defaultExportPreset} />)

    expect(screen.getByTestId('product-contact-shadow')).toBeInTheDocument()
  })

  it('renders the selected pedestal geometry in the scene', () => {
    const project = createInitialProject()
    project.pedestal.preset = 'steps'

    render(<BoxScene project={project} command={null} exportPreset={defaultExportPreset} />)

    expect(document.querySelector('mesh[name="pedestal-block-pedestal-base"]')).toBeInTheDocument()
  })

  it('renders the hanging tissue model for the hanging tissue packaging type', () => {
    const project = createInitialProject()
    getSelectedInstance(project).packagingType = 'hanging-tissue'

    render(<BoxScene project={project} command={null} exportPreset={defaultExportPreset} />)

    expect(screen.getByTestId('printed-hanging-tissue')).toBeInTheDocument()
  })

  it('renders the face tissue model for the face tissue packaging type', () => {
    const project = createInitialProject()
    getSelectedInstance(project).packagingType = 'face-tissue'

    render(<BoxScene project={project} command={null} exportPreset={defaultExportPreset} />)

    expect(screen.getByTestId('printed-face-tissue')).toBeInTheDocument()
  })

  it('renders the wet tissue model for the wet tissue packaging type', () => {
    const project = createInitialProject()
    getSelectedInstance(project).packagingType = 'wet-tissue'

    render(<BoxScene project={project} command={null} exportPreset={defaultExportPreset} />)

    expect(screen.getByTestId('printed-wet-tissue')).toBeInTheDocument()
  })

  it('renders the wash tissue model for the wash tissue packaging type', () => {
    const project = createInitialProject()
    getSelectedInstance(project).packagingType = 'wash-tissue'

    render(<BoxScene project={project} command={null} exportPreset={defaultExportPreset} />)

    expect(screen.getByTestId('printed-wash-tissue')).toBeInTheDocument()
  })
})
