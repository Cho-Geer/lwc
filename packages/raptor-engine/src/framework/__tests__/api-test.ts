import * as api from '../api';
import { Element } from "../html-element";
import { createElement } from './../main';

describe('api', () => {
    describe('#c()', () => {
        class Foo extends Element {}

        it('should call the Ctor factory for circular dependencies', () => {
            const factory = function () { return Foo };
            factory.__circular__ = true;
            const vnode = api.c('x-foo', factory, { className: 'foo' });
            expect(Foo).toBe(vnode.Ctor);
        });

        it('should convert className to a classMap property', () => {
            const vnode = api.c('x-foo', Foo, { className: 'foo' });
            expect(vnode.data.class).toEqual({ foo: true });
        });

        it('should split classNames on white spaces', () => {
            const vnode = api.c('x-foo', Foo, { className: 'foo bar   baz' });
            expect(vnode.data.class).toEqual({ foo: true, bar: true, baz: true });
        });

        it('should throw if the vnode contains both a computed className and a classMap', () => {
            expect(() => {
                api.c('x-foo', Foo, {
                    className: 'foo',
                    classMap: { foo: true }
                });
            }).toThrowError(/className/);
        });

        it('assign correct style value when styleMap is present', () => {
            const styleMap = { color: 'red' };
            const factory = function() {
                return Foo;
            };
            const vnode = api.c('x-foo', Foo, { styleMap });

            expect(vnode.data.style).toEqual({ color: 'red' });
        });

        it('assign correct style value when style is present', () => {
            const style = 'color:red';
            const factory = function () { return Foo };
            const vnode = api.c('x-foo', factory, { style });

            expect(vnode.data.style).toBe('color:red');
        });

        it('should coerce style to string when is object', () => {
            const style = {
                color: 'red'
            };
            const factory = function () { return Foo };
            const vnode = api.c('x-foo', factory, { style });

            expect(vnode.data.style).toBe('[object Object]');
        });

        it('should not throw an error when createElement is called without Ctor', function () {
            expect(() => {
                createElement('x-foo');
            }).not.toThrow();
        });

        it('should support forceTagName static definition to force tagname on root node', () => {
            class Bar extends Element {
                static forceTagName = 'div';
            }
            const element = createElement('x-foo', { is: Bar });
            expect(element.tagName).toBe('DIV');
            expect(element.getAttribute('is')).toBe('x-foo');
        });

        it('should not include is attribute when Ctor is not present', () => {
            class Bar extends Element {}
            const element = createElement('x-foo');
            expect(element.hasAttribute('is')).toBe(false);
        });

        it('should not include is attribute when forceTagName is not present on root', () => {
            class Bar extends Element {}
            const element = createElement('x-foo', { is: Bar });
            expect(element.hasAttribute('is')).toBe(false);
        });

        it('should ignore forceTagName static definition if "is" attribute is defined in template', () => {
            class Foo extends Element {
                render() {
                    return function ($api) {
                        return [$api.c('span', Bar, { attrs: { is: "x-bar" } })]
                    }
                }
            }
            class Bar extends Element {
                static forceTagName = 'div';
            }
            const elm = createElement('x-foo', { is: Foo });
            document.body.appendChild(elm);
            const span = elm.querySelector('span') as Element;
            expect(span.tagName).toEqual('SPAN');
            expect(span.getAttribute('is')).toEqual('x-bar');
        });

    });

    describe('#h()', () => {
        it('should convert className to a classMap property', () => {
            const vnode = api.h('p', { className: 'foo' }, []);
            expect(vnode.data.class).toEqual({ foo: true });
        });

        it('should allow null entries in children', () => {
            const vnode = api.h('p', {}, [null]);
            expect(vnode.children).toEqual([null]);
        });

        it('should split classNames on white spaces', () => {
            const vnode = api.h('p', { className: 'foo bar   baz' }, []);
            expect(vnode.data.class).toEqual({ foo: true, bar: true, baz: true });
        });

        it('should throw if the vnode contains both a computed className and a classMap', () => {
            expect(() => {
                api.h('p', {
                    className: 'foo',
                    classMap: { foo: true }
                }, []);
            }).toThrowError(/className/);
        });

        it('should throw for anything other than vnode and null', () => {
            expect(() => {
                api.h('p', {}, ['text']);
            });

            expect(() => {
                api.h('p', {}, [undefined]);
            });
        });

        it('assign correct style value when styleMap is present', () => {
            const styleMap = {
                color: 'red'
            };
            const vnode = api.h('p', { styleMap }, []);

            expect(vnode.data.style).toEqual({
                color: 'red'
            });
        });

        it('assign correct style value when style is present', () => {
            const style = 'color:red';
            const vnode = api.h('p', { style }, []);

            expect(vnode.data.style).toBe('color:red');
        });

        it('should coerce style to string when is object', () => {
            const style = {
                color: 'red'
            };
            const vnode = api.h('p', { style }, []);

            expect(vnode.data.style).toBe('[object Object]');
        });
    });

    describe('#i()', () => {
        it('should support various types', () => {
            expect(api.i([], () => null)).toEqual([]);
            expect(api.i(undefined as any, () => null)).toEqual([]);
            expect(api.i(null as any, () => null)).toEqual([]);
        });

        it('should support numeric keys', () => {
            expect(api.i([{key: 0}], () => null)).toEqual([null]);
            expect(api.i([{key: 1}], () => null)).toEqual([null]);
        });

        it('should provide item and index', () => {
            const o = {x: 1};
            const vnodes = api.i([o], (item, index) => ({ index, item }));
            expect(vnodes).toEqual([{ index: 0, item: o }]);
        });

        it('should provide correct last value', () => {
            const o = [
                {x: 1},
                {x: 2},
                {x: 3}
            ];
            const vnodes = api.i(o, (item, index, first, last) => last);
            expect(vnodes).toEqual([false, false, true]);
        });

        it('should handle arrays', function () {
            const o = [1, 2];
            const vnodes = api.i(o, (item) => item + 'a');
            expect(vnodes).toEqual(['1a', '2a']);
        });

        it('should handle Sets', function () {
            const o = new Set();
            o.add(1);
            o.add(2);
            const vnodes = api.i(o, (item) => item + 'a');
            expect(vnodes).toEqual(['1a', '2a']);
        });

        it('should handle Map', function () {
            const o = new Map();
            o.set('foo', 1);
            o.set('bar', 2);
            const vnodes = api.i(o, (item) => item + 'a');
            expect(vnodes).toEqual(['foo,1a', 'bar,2a']);
        });

        it('should handle proxies objects', function () {
            const array = [1, 2];
            const o = new Proxy(array, {});
            const vnodes = api.i(o, (item) => item + 'a');
            expect(vnodes).toEqual(['1a', '2a']);
        });
    });

    describe('#f()', () => {
        // TBD
    });

});
