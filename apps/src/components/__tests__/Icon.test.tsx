import React from 'react';
import { render } from '@testing-library/react-native';

import { Icon, type IconName } from '../Icon';

describe('Icon', () => {
  const known: IconName[] = ['brain', 'plus', 'nav-home', 'wallet', 'sparkle'];

  it.each(known)('renders the "%s" glyph without crashing', (name) => {
    const { toJSON } = render(<Icon name={name} />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders nothing for an unknown icon name', () => {
    const { toJSON } = render(<Icon name={'does-not-exist' as IconName} />);
    expect(toJSON()).toBeNull();
  });

  it('honors a custom size on the svg root', () => {
    const { toJSON } = render(<Icon name="plus" size={40} />);
    const tree = toJSON() as { props: Record<string, unknown> } | null;
    expect(tree?.props.width).toBe(40);
    expect(tree?.props.height).toBe(40);
  });
});
