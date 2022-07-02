import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import Header from '../Header.vue'

describe('ApplyForm', () => {
  it('with minimal props', () => {
    expect(Header).toBeDefined();
    const wrapper = mount(Header);
    //expect(wrapper.text()).toContain('');
  })
})
