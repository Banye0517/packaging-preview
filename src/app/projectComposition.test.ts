import { describe, expect, it } from 'vitest'

import {
  createInitialProject,
  getSelectedInstance,
  projectReducer,
} from './projectReducer'

describe('project composition state', () => {
  it('starts with one selected box instance', () => {
    const project = createInitialProject()

    expect(project.version).toBe(20)
    expect(project.pedestal).toEqual({ preset: 'none', color: 'warm-white', cornerRadiusMm: 8 })
    expect(project.instances).toHaveLength(1)
    expect(getSelectedInstance(project).packagingType).toBe('box')
  })

  it('preserves pedestal settings across composition actions', () => {
    let project = createInitialProject()
    project = projectReducer(project, { type: 'pedestal/preset-set', value: 'steps' })
    project = projectReducer(project, { type: 'pedestal/color-set', value: 'light-pink' })
    project = projectReducer(project, {
      type: 'instance/add', packagingType: 'pouch', id: 'pouch-2',
    })

    expect(project.pedestal).toEqual({ preset: 'steps', color: 'light-pink', cornerRadiusMm: 8 })
  })

  it('stores a clamped project-level pedestal radius', () => {
    let project = createInitialProject()
    expect(project.pedestal.cornerRadiusMm).toBe(8)

    project = projectReducer(project, { type: 'pedestal/radius-set', value: 24 })
    expect(project.pedestal.cornerRadiusMm).toBe(24)

    project = projectReducer(project, { type: 'pedestal/radius-set', value: 80 })
    expect(project.pedestal.cornerRadiusMm).toBe(30)
  })

  it('adds and selects a blank instance with the count recommendation', () => {
    const next = projectReducer(createInitialProject(), {
      type: 'instance/add', packagingType: 'pouch', id: 'pouch-1',
    })

    expect(next.instances).toHaveLength(2)
    expect(next.selectedInstanceId).toBe('pouch-1')
    expect(next.layout).toBe('family')
  })

  it('edits only the selected instance', () => {
    const two = projectReducer(createInitialProject(), {
      type: 'instance/add', packagingType: 'box', id: 'box-2',
    })
    const changed = projectReducer(two, {
      type: 'package/edit', action: { type: 'box/set', key: 'width', value: 280 },
    })

    expect(changed.instances[0].box.width).toBe(160)
    expect(changed.instances[1].box.width).toBe(280)
  })

  it('recommends layouts by count and keeps a manual layout during edits', () => {
    let project = createInitialProject()
    project = projectReducer(project, { type: 'instance/add', packagingType: 'box', id: 'box-2' })
    project = projectReducer(project, { type: 'instance/add', packagingType: 'box', id: 'box-3' })
    expect(project.layout).toBe('cluster')
    project = projectReducer(project, { type: 'layout/set', value: 'hero' })
    expect(project.heroInstanceId).toBe('box-3')
    project = projectReducer(project, {
      type: 'package/edit', action: { type: 'box/set', key: 'height', value: 300 },
    })
    expect(project.layout).toBe('hero')
  })

  it('prevents a seventh instance and removal of the final instance', () => {
    let project = createInitialProject()
    for (let index = 2; index <= 6; index += 1) {
      project = projectReducer(project, {
        type: 'instance/add', packagingType: 'box', id: `box-${index}`,
      })
    }
    expect(project.layout).toBe('grid')
    expect(projectReducer(project, {
      type: 'instance/add', packagingType: 'box', id: 'box-7',
    })).toBe(project)

    const initial = createInitialProject()
    expect(projectReducer(initial, {
      type: 'instance/remove', id: initial.selectedInstanceId,
    })).toBe(initial)
  })

  it('selects a neighbor and reapplies the recommendation after removal', () => {
    let project = createInitialProject()
    project = projectReducer(project, { type: 'instance/add', packagingType: 'pouch', id: 'pouch-1' })
    project = projectReducer(project, { type: 'instance/add', packagingType: 'box', id: 'box-2' })
    project = projectReducer(project, { type: 'layout/set', value: 'hero' })
    project = projectReducer(project, { type: 'instance/remove', id: 'box-2' })

    expect(project.instances).toHaveLength(2)
    expect(project.selectedInstanceId).toBe('pouch-1')
    expect(project.layout).toBe('family')
    expect(project.heroInstanceId).toBeNull()
  })
})
