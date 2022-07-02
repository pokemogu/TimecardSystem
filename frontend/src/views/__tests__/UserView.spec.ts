import { describe, it, expect, beforeEach, fn } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, getActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { useSessionStore } from '../../stores/session';
import ApplyForm from '../UserView.vue'

describe('ApplyForm', () => {
  const testData = [
    {
      applyName: 'Test Apply',
      applyType: 'test',
      userDepartment: 'Human Resource Department'
    },
    {
      applyName: '打刻申請',
      applyType: 'record',
      userDepartment: '浜松工場'
    },
    {
      applyName: 'その他申請',
      applyType: 'other',
      userDepartment: '名古屋事業部'
    },
  ];

  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: fn }));
  });

  it('with minimal props', () => {
    expect(ApplyForm).toBeDefined();

    const store = useSessionStore();
    for (const eachTestData of testData) {
      const wrapper = mount(ApplyForm, {
        props: {
          applyName: eachTestData.applyName,
          applyType: eachTestData.applyType,
          dateFrom: ''
        },
        global: {
          plugins: [getActivePinia()]
        }
      });

      expect(wrapper.text()).toContain(eachTestData.applyName);
      expect(wrapper.text()).toContain(eachTestData.userDepartment);

      wrapper.unmount();
    }
  })
})
