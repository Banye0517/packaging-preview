import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@react-three/drei', () => ({
  Environment: ({ children }: { children: React.ReactNode }) => <div data-testid="environment">{children}</div>,
  Lightformer: () => <span data-testid="lightformer" />,
}))

import { StudioEnvironment } from './StudioEnvironment'

describe('StudioEnvironment', () => {
  it('provides local reflections for metallic finish materials', () => {
    render(<StudioEnvironment />)

    expect(screen.getByTestId('environment')).toBeInTheDocument()
    expect(screen.getAllByTestId('lightformer').length).toBeGreaterThanOrEqual(2)
  })
})
