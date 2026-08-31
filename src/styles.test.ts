// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')

describe('desktop fixed preview layout', () => {
  it('does not draw a decorative oval shadow below the 3D preview', () => {
    expect(css).not.toMatch(/\.preview-stage::after\s*\{/)
  })

  it('locks the desktop page and scrolls only the settings panel', () => {
    expect(css).toContain('height: 100dvh')
    expect(css).toMatch(/html,\s*body,\s*#root\s*\{[^}]*min-height:\s*0/s)
    expect(css).toContain('overflow: hidden')
    expect(css).toMatch(/body\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s)
    expect(css).toMatch(/\.settings-panel\s*\{[^}]*overflow-y:\s*auto/s)
    expect(css).toMatch(/\.workspace\s*\{[^}]*height:\s*calc\(100dvh - 72px\)/s)
  })

  it('restores document scrolling for the mobile stacked layout', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 760px)'))
    expect(mobile).toMatch(/html,\s*body,\s*#root\s*\{[^}]*overflow:\s*auto/s)
    expect(mobile).toMatch(/html,\s*body,\s*#root\s*\{[^}]*min-height:\s*100vh/s)
    expect(mobile).toMatch(/body\s*\{[^}]*position:\s*static/s)
    expect(mobile).toMatch(/\.workspace\s*\{[^}]*height:\s*auto/s)
  })
})
