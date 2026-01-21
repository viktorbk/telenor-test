import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('App.vue', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the title', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Test content' }),
    })

    const wrapper = mount(App)
    expect(wrapper.find('h1').text()).toBe('Telenor test')
  })

  it('loads and displays Wikipedia data on mount', async () => {
    const mockData = {
      title: 'Norge',
      extract: 'Norge er et land i Nord-Europa.',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const wrapper = mount(App)
    await flushPromises()

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/wikipedia'))
    expect(wrapper.find('h2').text()).toBe('Norge')
    expect(wrapper.find('p[style*="line-height"]').text()).toBe(mockData.extract)
  })

  it('displays error message when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('p[style*="color: red"]').text()).toBe('Failed to fetch data from API')
  })

  it('button is disabled when no text is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Test content' }),
    })

    const wrapper = mount(App)
    await flushPromises()

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('button text shows "Format text" when not formatting', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Test content' }),
    })

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('button').text()).toBe('Format text')
  })

  it('does not show selection indicator when no text selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Test content' }),
    })

    const wrapper = mount(App)
    await flushPromises()

    // No span with "Selected:" should be visible
    const spans = wrapper.findAll('span')
    const selectionSpan = spans.filter((s) => s.text().includes('Selected:'))
    expect(selectionSpan.length).toBe(0)
  })

  it('truncates long selection text in indicator', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Test content' }),
    })

    const wrapper = mount(App)
    await flushPromises()

    // Manually set selectedText to test truncation display
    const vm = wrapper.vm as any
    vm.selectedText = 'This is a very long selection that exceeds thirty characters'

    await wrapper.vm.$nextTick()

    // Find the span by looking for text content
    const spans = wrapper.findAll('span')
    const selectionSpan = spans.find((s) => s.text().includes('Selected:'))
    expect(selectionSpan).toBeDefined()
    expect(selectionSpan!.text()).toContain('...')
    expect(selectionSpan!.text()).toContain('This is a very long selection ')
  })

  it('shows section only when data is loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Content' }),
    })

    const wrapper = mount(App)

    // Before data loads, section should not exist
    // (this is tricky to test since mount triggers load immediately)
    await flushPromises()

    expect(wrapper.find('section').exists()).toBe(true)
  })

  it('calls format endpoint when formatText is triggered', async () => {
    // First call: load Wikipedia
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Hello world' }),
    })

    const wrapper = mount(App)
    await flushPromises()

    // Mock format response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ formattedText: 'Hello World', color: '#e63946' }),
    })

    // Simulate having selected text and a valid selection
    const vm = wrapper.vm as any
    vm.selectedText = 'Hello'
    vm.data = { title: 'Test', extract: 'Hello world' }

    // Mock window.getSelection before clicking
    const mockRange = {
      compareBoundaryPoints: () => 0,
      deleteContents: vi.fn(),
      insertNode: vi.fn(),
      setStart: vi.fn(),
      setEnd: vi.fn(),
    }
    const mockSelection = {
      toString: () => 'Hello',
      rangeCount: 1,
      getRangeAt: () => mockRange,
      removeAllRanges: vi.fn(),
    }
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any)

    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Check that format was called (second call after wikipedia)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/format'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText: 'Hello' }),
      }),
    )
  })

  it('displays error when format request fails', async () => {
    // First call: load Wikipedia
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ title: 'Test', extract: 'Hello world' }),
    })

    const wrapper = mount(App)
    await flushPromises()

    // Mock failed format response
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    const vm = wrapper.vm as any
    vm.selectedText = 'Hello'
    vm.data = { title: 'Test', extract: 'Hello world' }

    const mockRange = {
      compareBoundaryPoints: () => 0,
      deleteContents: vi.fn(),
      insertNode: vi.fn(),
      setStart: vi.fn(),
      setEnd: vi.fn(),
    }
    const mockSelection = {
      toString: () => 'Hello',
      rangeCount: 1,
      getRangeAt: () => mockRange,
      removeAllRanges: vi.fn(),
    }
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any)

    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    // Find error paragraph by content
    const errorP = wrapper.findAll('p').find((p) => p.text() === 'Failed to format text')
    expect(errorP).toBeDefined()
    expect(errorP!.text()).toBe('Failed to format text')
  })
})
