import { Path } from './path';

describe('add', () => {
  it('', () => {
    const root = new Path('/');

    expect(new Path('/')).toStrictEqual(new Path('/'));

    expect(new Path('/a')).toStrictEqual(new Path('//a'));
    expect(new Path('/a')).toStrictEqual(new Path('\\a'));

    expect(new Path('/a')).toStrictEqual(new Path('/a/'));

    expect(new Path('/a')).toStrictEqual(new Path('/a/b').parent());

    expect(new Path('/a/b')).toStrictEqual(new Path('/a').child('b'));
    expect(new Path('/a/b')).toStrictEqual(new Path('/a').child('/b'));
    expect(new Path('/a/b')).toStrictEqual(new Path('/a/').child('/b'));
  });
});
