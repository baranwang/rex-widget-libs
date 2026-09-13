import { expect, test } from '@rstest/core';
import { WidgetAdaptor } from './widget-adaptor';

test('WidgetAdaptor.http.get is a function', () => {
  expect(typeof WidgetAdaptor.http.get).toBe('function');
});
