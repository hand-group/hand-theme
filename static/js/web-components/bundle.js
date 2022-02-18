
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function (exports) {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children$1(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    function attribute_to_object(attributes) {
        const result = {};
        for (const attribute of attributes) {
            result[attribute.name] = attribute.value;
        }
        return result;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update$1(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children$1(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                const { on_mount } = this.$$;
                this.$$.on_disconnect = on_mount.map(run).filter(is_function);
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            disconnectedCallback() {
                run_all(this.$$.on_disconnect);
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set($$props) {
                if (this.$$set && !is_empty($$props)) {
                    this.$$.skip_bound = true;
                    this.$$set($$props);
                    this.$$.skip_bound = false;
                }
            }
        };
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }

    /* src/Counter.svelte generated by Svelte v3.46.2 */

    const file$2 = "src/Counter.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let button;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			button = element("button");
    			button.textContent = "Klick";
    			t1 = space();
    			t2 = text(/*counter*/ ctx[0]);
    			this.c = noop;
    			add_location(button, file$2, 11, 4, 148);
    			add_location(main, file$2, 10, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button);
    			append_dev(main, t1);
    			append_dev(main, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleClick*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*counter*/ 1) set_data_dev(t2, /*counter*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let counter;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('svelte-counter', slots, []);

    	function handleClick() {
    		$$invalidate(0, counter += 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<svelte-counter> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ handleClick, counter });

    	$$self.$inject_state = $$props => {
    		if ('counter' in $$props) $$invalidate(0, counter = $$props.counter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(0, counter = 0);
    	return [counter, handleClick];
    }

    class Counter extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>main{text-align:center;padding:1em;max-width:240px;margin:0 auto}@media(min-width: 640px){main{max-width:none}}</style>`;

    		init$1(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("svelte-counter", Counter);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var STATE_DELIMITER = '.';
    var EMPTY_ACTIVITY_MAP = {};
    var DEFAULT_GUARD_TYPE = 'xstate.guard';
    var TARGETLESS_KEY = '';

    var IS_PRODUCTION = {"NODE_ENV":"development","API_URL":"https://strapi.hand.group","API_URL_DEV":"http://localhost:1337"}.NODE_ENV === 'production';

    var _a;
    function keys(value) {
      return Object.keys(value);
    }
    function matchesState(parentStateId, childStateId, delimiter) {
      if (delimiter === void 0) {
        delimiter = STATE_DELIMITER;
      }

      var parentStateValue = toStateValue(parentStateId, delimiter);
      var childStateValue = toStateValue(childStateId, delimiter);

      if (isString(childStateValue)) {
        if (isString(parentStateValue)) {
          return childStateValue === parentStateValue;
        } // Parent more specific than child


        return false;
      }

      if (isString(parentStateValue)) {
        return parentStateValue in childStateValue;
      }

      return keys(parentStateValue).every(function (key) {
        if (!(key in childStateValue)) {
          return false;
        }

        return matchesState(parentStateValue[key], childStateValue[key]);
      });
    }
    function getEventType(event) {
      try {
        return isString(event) || typeof event === 'number' ? "".concat(event) : event.type;
      } catch (e) {
        throw new Error('Events must be strings or objects with a string event.type property.');
      }
    }
    function toStatePath(stateId, delimiter) {
      try {
        if (isArray(stateId)) {
          return stateId;
        }

        return stateId.toString().split(delimiter);
      } catch (e) {
        throw new Error("'".concat(stateId, "' is not a valid state path."));
      }
    }
    function isStateLike(state) {
      return typeof state === 'object' && 'value' in state && 'context' in state && 'event' in state && '_event' in state;
    }
    function toStateValue(stateValue, delimiter) {
      if (isStateLike(stateValue)) {
        return stateValue.value;
      }

      if (isArray(stateValue)) {
        return pathToStateValue(stateValue);
      }

      if (typeof stateValue !== 'string') {
        return stateValue;
      }

      var statePath = toStatePath(stateValue, delimiter);
      return pathToStateValue(statePath);
    }
    function pathToStateValue(statePath) {
      if (statePath.length === 1) {
        return statePath[0];
      }

      var value = {};
      var marker = value;

      for (var i = 0; i < statePath.length - 1; i++) {
        if (i === statePath.length - 2) {
          marker[statePath[i]] = statePath[i + 1];
        } else {
          marker[statePath[i]] = {};
          marker = marker[statePath[i]];
        }
      }

      return value;
    }
    function mapValues(collection, iteratee) {
      var result = {};
      var collectionKeys = keys(collection);

      for (var i = 0; i < collectionKeys.length; i++) {
        var key = collectionKeys[i];
        result[key] = iteratee(collection[key], key, collection, i);
      }

      return result;
    }
    function mapFilterValues(collection, iteratee, predicate) {
      var e_1, _a;

      var result = {};

      try {
        for (var _b = __values(keys(collection)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var key = _c.value;
          var item = collection[key];

          if (!predicate(item)) {
            continue;
          }

          result[key] = iteratee(item, key, collection);
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      return result;
    }
    /**
     * Retrieves a value at the given path.
     * @param props The deep path to the prop of the desired value
     */

    var path = function (props) {
      return function (object) {
        var e_2, _a;

        var result = object;

        try {
          for (var props_1 = __values(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
            var prop = props_1_1.value;
            result = result[prop];
          }
        } catch (e_2_1) {
          e_2 = {
            error: e_2_1
          };
        } finally {
          try {
            if (props_1_1 && !props_1_1.done && (_a = props_1.return)) _a.call(props_1);
          } finally {
            if (e_2) throw e_2.error;
          }
        }

        return result;
      };
    };
    /**
     * Retrieves a value at the given path via the nested accessor prop.
     * @param props The deep path to the prop of the desired value
     */

    function nestedPath(props, accessorProp) {
      return function (object) {
        var e_3, _a;

        var result = object;

        try {
          for (var props_2 = __values(props), props_2_1 = props_2.next(); !props_2_1.done; props_2_1 = props_2.next()) {
            var prop = props_2_1.value;
            result = result[accessorProp][prop];
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (props_2_1 && !props_2_1.done && (_a = props_2.return)) _a.call(props_2);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        return result;
      };
    }
    function toStatePaths(stateValue) {
      if (!stateValue) {
        return [[]];
      }

      if (isString(stateValue)) {
        return [[stateValue]];
      }

      var result = flatten(keys(stateValue).map(function (key) {
        var subStateValue = stateValue[key];

        if (typeof subStateValue !== 'string' && (!subStateValue || !Object.keys(subStateValue).length)) {
          return [[key]];
        }

        return toStatePaths(stateValue[key]).map(function (subPath) {
          return [key].concat(subPath);
        });
      }));
      return result;
    }
    function flatten(array) {
      var _a;

      return (_a = []).concat.apply(_a, __spreadArray([], __read(array), false));
    }
    function toArrayStrict(value) {
      if (isArray(value)) {
        return value;
      }

      return [value];
    }
    function toArray(value) {
      if (value === undefined) {
        return [];
      }

      return toArrayStrict(value);
    }
    function mapContext(mapper, context, _event) {
      var e_5, _a;

      if (isFunction(mapper)) {
        return mapper(context, _event.data);
      }

      var result = {};

      try {
        for (var _b = __values(Object.keys(mapper)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var key = _c.value;
          var subMapper = mapper[key];

          if (isFunction(subMapper)) {
            result[key] = subMapper(context, _event.data);
          } else {
            result[key] = subMapper;
          }
        }
      } catch (e_5_1) {
        e_5 = {
          error: e_5_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_5) throw e_5.error;
        }
      }

      return result;
    }
    function isBuiltInEvent(eventType) {
      return /^(done|error)\./.test(eventType);
    }
    function isPromiseLike(value) {
      if (value instanceof Promise) {
        return true;
      } // Check if shape matches the Promise/A+ specification for a "thenable".


      if (value !== null && (isFunction(value) || typeof value === 'object') && isFunction(value.then)) {
        return true;
      }

      return false;
    }
    function isBehavior(value) {
      return value !== null && typeof value === 'object' && 'transition' in value && typeof value.transition === 'function';
    }
    function partition(items, predicate) {
      var e_6, _a;

      var _b = __read([[], []], 2),
          truthy = _b[0],
          falsy = _b[1];

      try {
        for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
          var item = items_1_1.value;

          if (predicate(item)) {
            truthy.push(item);
          } else {
            falsy.push(item);
          }
        }
      } catch (e_6_1) {
        e_6 = {
          error: e_6_1
        };
      } finally {
        try {
          if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        } finally {
          if (e_6) throw e_6.error;
        }
      }

      return [truthy, falsy];
    }
    function updateHistoryStates(hist, stateValue) {
      return mapValues(hist.states, function (subHist, key) {
        if (!subHist) {
          return undefined;
        }

        var subStateValue = (isString(stateValue) ? undefined : stateValue[key]) || (subHist ? subHist.current : undefined);

        if (!subStateValue) {
          return undefined;
        }

        return {
          current: subStateValue,
          states: updateHistoryStates(subHist, subStateValue)
        };
      });
    }
    function updateHistoryValue(hist, stateValue) {
      return {
        current: stateValue,
        states: updateHistoryStates(hist, stateValue)
      };
    }
    function updateContext(context, _event, assignActions, state) {
      {
        warn(!!context, 'Attempting to update undefined context');
      }

      var updatedContext = context ? assignActions.reduce(function (acc, assignAction) {
        var e_7, _a;

        var assignment = assignAction.assignment;
        var meta = {
          state: state,
          action: assignAction,
          _event: _event
        };
        var partialUpdate = {};

        if (isFunction(assignment)) {
          partialUpdate = assignment(acc, _event.data, meta);
        } else {
          try {
            for (var _b = __values(keys(assignment)), _c = _b.next(); !_c.done; _c = _b.next()) {
              var key = _c.value;
              var propAssignment = assignment[key];
              partialUpdate[key] = isFunction(propAssignment) ? propAssignment(acc, _event.data, meta) : propAssignment;
            }
          } catch (e_7_1) {
            e_7 = {
              error: e_7_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_7) throw e_7.error;
            }
          }
        }

        return Object.assign({}, acc, partialUpdate);
      }, context) : context;
      return updatedContext;
    } // tslint:disable-next-line:no-empty

    var warn = function () {};

    {
      warn = function (condition, message) {
        var error = condition instanceof Error ? condition : undefined;

        if (!error && condition) {
          return;
        }

        if (console !== undefined) {
          var args = ["Warning: ".concat(message)];

          if (error) {
            args.push(error);
          } // tslint:disable-next-line:no-console


          console.warn.apply(console, args);
        }
      };
    }
    function isArray(value) {
      return Array.isArray(value);
    } // tslint:disable-next-line:ban-types

    function isFunction(value) {
      return typeof value === 'function';
    }
    function isString(value) {
      return typeof value === 'string';
    } // export function memoizedGetter<T, TP extends { prototype: object }>(
    //   o: TP,
    //   property: string,
    //   getter: () => T
    // ): void {
    //   Object.defineProperty(o.prototype, property, {
    //     get: getter,
    //     enumerable: false,
    //     configurable: false
    //   });
    // }

    function toGuard(condition, guardMap) {
      if (!condition) {
        return undefined;
      }

      if (isString(condition)) {
        return {
          type: DEFAULT_GUARD_TYPE,
          name: condition,
          predicate: guardMap ? guardMap[condition] : undefined
        };
      }

      if (isFunction(condition)) {
        return {
          type: DEFAULT_GUARD_TYPE,
          name: condition.name,
          predicate: condition
        };
      }

      return condition;
    }
    function isObservable(value) {
      try {
        return 'subscribe' in value && isFunction(value.subscribe);
      } catch (e) {
        return false;
      }
    }
    var symbolObservable = /*#__PURE__*/function () {
      return typeof Symbol === 'function' && Symbol.observable || '@@observable';
    }();
    var interopSymbols = (_a = {}, _a[symbolObservable] = function () {
      return this;
    }, _a);
    function isMachine(value) {
      try {
        return '__xstatenode' in value;
      } catch (e) {
        return false;
      }
    }
    function isActor$1(value) {
      return !!value && typeof value.send === 'function';
    }
    function toEventObject(event, payload // id?: TEvent['type']
    ) {
      if (isString(event) || typeof event === 'number') {
        return __assign({
          type: event
        }, payload);
      }

      return event;
    }
    function toSCXMLEvent(event, scxmlEvent) {
      if (!isString(event) && '$$type' in event && event.$$type === 'scxml') {
        return event;
      }

      var eventObject = toEventObject(event);
      return __assign({
        name: eventObject.type,
        data: eventObject,
        $$type: 'scxml',
        type: 'external'
      }, scxmlEvent);
    }
    function toTransitionConfigArray(event, configLike) {
      var transitions = toArrayStrict(configLike).map(function (transitionLike) {
        if (typeof transitionLike === 'undefined' || typeof transitionLike === 'string' || isMachine(transitionLike)) {
          return {
            target: transitionLike,
            event: event
          };
        }

        return __assign(__assign({}, transitionLike), {
          event: event
        });
      });
      return transitions;
    }
    function normalizeTarget(target) {
      if (target === undefined || target === TARGETLESS_KEY) {
        return undefined;
      }

      return toArray(target);
    }
    function reportUnhandledExceptionOnInvocation(originalError, currentError, id) {
      {
        var originalStackTrace = originalError.stack ? " Stacktrace was '".concat(originalError.stack, "'") : '';

        if (originalError === currentError) {
          // tslint:disable-next-line:no-console
          console.error("Missing onError handler for invocation '".concat(id, "', error was '").concat(originalError, "'.").concat(originalStackTrace));
        } else {
          var stackTrace = currentError.stack ? " Stacktrace was '".concat(currentError.stack, "'") : ''; // tslint:disable-next-line:no-console

          console.error("Missing onError handler and/or unhandled exception/promise rejection for invocation '".concat(id, "'. ") + "Original error: '".concat(originalError, "'. ").concat(originalStackTrace, " Current error is '").concat(currentError, "'.").concat(stackTrace));
        }
      }
    }
    function evaluateGuard(machine, guard, context, _event, state) {
      var guards = machine.options.guards;
      var guardMeta = {
        state: state,
        cond: guard,
        _event: _event
      }; // TODO: do not hardcode!

      if (guard.type === DEFAULT_GUARD_TYPE) {
        return ((guards === null || guards === void 0 ? void 0 : guards[guard.name]) || guard.predicate)(context, _event.data, guardMeta);
      }

      var condFn = guards === null || guards === void 0 ? void 0 : guards[guard.type];

      if (!condFn) {
        throw new Error("Guard '".concat(guard.type, "' is not implemented on machine '").concat(machine.id, "'."));
      }

      return condFn(context, _event.data, guardMeta);
    }
    function toInvokeSource$1(src) {
      if (typeof src === 'string') {
        return {
          type: src
        };
      }

      return src;
    }
    function toObserver(nextHandler, errorHandler, completionHandler) {
      if (typeof nextHandler === 'object') {
        return nextHandler;
      }

      var noop = function () {
        return void 0;
      };

      return {
        next: nextHandler,
        error: errorHandler || noop,
        complete: completionHandler || noop
      };
    }
    function createInvokeId(stateNodeId, index) {
      return "".concat(stateNodeId, ":invocation[").concat(index, "]");
    }

    var ActionTypes;

    (function (ActionTypes) {
      ActionTypes["Start"] = "xstate.start";
      ActionTypes["Stop"] = "xstate.stop";
      ActionTypes["Raise"] = "xstate.raise";
      ActionTypes["Send"] = "xstate.send";
      ActionTypes["Cancel"] = "xstate.cancel";
      ActionTypes["NullEvent"] = "";
      ActionTypes["Assign"] = "xstate.assign";
      ActionTypes["After"] = "xstate.after";
      ActionTypes["DoneState"] = "done.state";
      ActionTypes["DoneInvoke"] = "done.invoke";
      ActionTypes["Log"] = "xstate.log";
      ActionTypes["Init"] = "xstate.init";
      ActionTypes["Invoke"] = "xstate.invoke";
      ActionTypes["ErrorExecution"] = "error.execution";
      ActionTypes["ErrorCommunication"] = "error.communication";
      ActionTypes["ErrorPlatform"] = "error.platform";
      ActionTypes["ErrorCustom"] = "xstate.error";
      ActionTypes["Update"] = "xstate.update";
      ActionTypes["Pure"] = "xstate.pure";
      ActionTypes["Choose"] = "xstate.choose";
    })(ActionTypes || (ActionTypes = {}));

    var SpecialTargets;

    (function (SpecialTargets) {
      SpecialTargets["Parent"] = "#_parent";
      SpecialTargets["Internal"] = "#_internal";
    })(SpecialTargets || (SpecialTargets = {}));

    var start$1 = ActionTypes.Start;
    var stop$2 = ActionTypes.Stop;
    var raise$1 = ActionTypes.Raise;
    var send$1 = ActionTypes.Send;
    var cancel$1 = ActionTypes.Cancel;
    var nullEvent = ActionTypes.NullEvent;
    var assign = ActionTypes.Assign;
    ActionTypes.After;
    ActionTypes.DoneState;
    var log = ActionTypes.Log;
    var init = ActionTypes.Init;
    var invoke = ActionTypes.Invoke;
    ActionTypes.ErrorExecution;
    var errorPlatform = ActionTypes.ErrorPlatform;
    var error$1 = ActionTypes.ErrorCustom;
    var update = ActionTypes.Update;
    var choose = ActionTypes.Choose;
    var pure = ActionTypes.Pure;

    var initEvent = /*#__PURE__*/toSCXMLEvent({
      type: init
    });
    function getActionFunction(actionType, actionFunctionMap) {
      return actionFunctionMap ? actionFunctionMap[actionType] || undefined : undefined;
    }
    function toActionObject(action, actionFunctionMap) {
      var actionObject;

      if (isString(action) || typeof action === 'number') {
        var exec = getActionFunction(action, actionFunctionMap);

        if (isFunction(exec)) {
          actionObject = {
            type: action,
            exec: exec
          };
        } else if (exec) {
          actionObject = exec;
        } else {
          actionObject = {
            type: action,
            exec: undefined
          };
        }
      } else if (isFunction(action)) {
        actionObject = {
          // Convert action to string if unnamed
          type: action.name || action.toString(),
          exec: action
        };
      } else {
        var exec = getActionFunction(action.type, actionFunctionMap);

        if (isFunction(exec)) {
          actionObject = __assign(__assign({}, action), {
            exec: exec
          });
        } else if (exec) {
          var actionType = exec.type || action.type;
          actionObject = __assign(__assign(__assign({}, exec), action), {
            type: actionType
          });
        } else {
          actionObject = action;
        }
      }

      return actionObject;
    }
    var toActionObjects = function (action, actionFunctionMap) {
      if (!action) {
        return [];
      }

      var actions = isArray(action) ? action : [action];
      return actions.map(function (subAction) {
        return toActionObject(subAction, actionFunctionMap);
      });
    };
    function toActivityDefinition(action) {
      var actionObject = toActionObject(action);
      return __assign(__assign({
        id: isString(action) ? action : actionObject.id
      }, actionObject), {
        type: actionObject.type
      });
    }
    /**
     * Raises an event. This places the event in the internal event queue, so that
     * the event is immediately consumed by the machine in the current step.
     *
     * @param eventType The event to raise.
     */

    function raise(event) {
      if (!isString(event)) {
        return send(event, {
          to: SpecialTargets.Internal
        });
      }

      return {
        type: raise$1,
        event: event
      };
    }
    function resolveRaise(action) {
      return {
        type: raise$1,
        _event: toSCXMLEvent(action.event)
      };
    }
    /**
     * Sends an event. This returns an action that will be read by an interpreter to
     * send the event in the next step, after the current step is finished executing.
     *
     * @param event The event to send.
     * @param options Options to pass into the send event:
     *  - `id` - The unique send event identifier (used with `cancel()`).
     *  - `delay` - The number of milliseconds to delay the sending of the event.
     *  - `to` - The target of this event (by default, the machine the event was sent from).
     */

    function send(event, options) {
      return {
        to: options ? options.to : undefined,
        type: send$1,
        event: isFunction(event) ? event : toEventObject(event),
        delay: options ? options.delay : undefined,
        id: options && options.id !== undefined ? options.id : isFunction(event) ? event.name : getEventType(event)
      };
    }
    function resolveSend(action, ctx, _event, delaysMap) {
      var meta = {
        _event: _event
      }; // TODO: helper function for resolving Expr

      var resolvedEvent = toSCXMLEvent(isFunction(action.event) ? action.event(ctx, _event.data, meta) : action.event);
      var resolvedDelay;

      if (isString(action.delay)) {
        var configDelay = delaysMap && delaysMap[action.delay];
        resolvedDelay = isFunction(configDelay) ? configDelay(ctx, _event.data, meta) : configDelay;
      } else {
        resolvedDelay = isFunction(action.delay) ? action.delay(ctx, _event.data, meta) : action.delay;
      }

      var resolvedTarget = isFunction(action.to) ? action.to(ctx, _event.data, meta) : action.to;
      return __assign(__assign({}, action), {
        to: resolvedTarget,
        _event: resolvedEvent,
        event: resolvedEvent.data,
        delay: resolvedDelay
      });
    }
    var resolveLog = function (action, ctx, _event) {
      return __assign(__assign({}, action), {
        value: isString(action.expr) ? action.expr : action.expr(ctx, _event.data, {
          _event: _event
        })
      });
    };
    /**
     * Cancels an in-flight `send(...)` action. A canceled sent action will not
     * be executed, nor will its event be sent, unless it has already been sent
     * (e.g., if `cancel(...)` is called after the `send(...)` action's `delay`).
     *
     * @param sendId The `id` of the `send(...)` action to cancel.
     */

    var cancel = function (sendId) {
      return {
        type: cancel$1,
        sendId: sendId
      };
    };
    /**
     * Starts an activity.
     *
     * @param activity The activity to start.
     */

    function start(activity) {
      var activityDef = toActivityDefinition(activity);
      return {
        type: ActionTypes.Start,
        activity: activityDef,
        exec: undefined
      };
    }
    /**
     * Stops an activity.
     *
     * @param actorRef The activity to stop.
     */

    function stop$1(actorRef) {
      var activity = isFunction(actorRef) ? actorRef : toActivityDefinition(actorRef);
      return {
        type: ActionTypes.Stop,
        activity: activity,
        exec: undefined
      };
    }
    function resolveStop(action, context, _event) {
      var actorRefOrString = isFunction(action.activity) ? action.activity(context, _event.data) : action.activity;
      var resolvedActorRef = typeof actorRefOrString === 'string' ? {
        id: actorRefOrString
      } : actorRefOrString;
      var actionObject = {
        type: ActionTypes.Stop,
        activity: resolvedActorRef
      };
      return actionObject;
    }
    /**
     * Returns an event type that represents an implicit event that
     * is sent after the specified `delay`.
     *
     * @param delayRef The delay in milliseconds
     * @param id The state node ID where this event is handled
     */

    function after(delayRef, id) {
      var idSuffix = id ? "#".concat(id) : '';
      return "".concat(ActionTypes.After, "(").concat(delayRef, ")").concat(idSuffix);
    }
    /**
     * Returns an event that represents that a final state node
     * has been reached in the parent state node.
     *
     * @param id The final state node's parent state node `id`
     * @param data The data to pass into the event
     */

    function done(id, data) {
      var type = "".concat(ActionTypes.DoneState, ".").concat(id);
      var eventObject = {
        type: type,
        data: data
      };

      eventObject.toString = function () {
        return type;
      };

      return eventObject;
    }
    /**
     * Returns an event that represents that an invoked service has terminated.
     *
     * An invoked service is terminated when it has reached a top-level final state node,
     * but not when it is canceled.
     *
     * @param id The final state node ID
     * @param data The data to pass into the event
     */

    function doneInvoke(id, data) {
      var type = "".concat(ActionTypes.DoneInvoke, ".").concat(id);
      var eventObject = {
        type: type,
        data: data
      };

      eventObject.toString = function () {
        return type;
      };

      return eventObject;
    }
    function error(id, data) {
      var type = "".concat(ActionTypes.ErrorPlatform, ".").concat(id);
      var eventObject = {
        type: type,
        data: data
      };

      eventObject.toString = function () {
        return type;
      };

      return eventObject;
    }
    function resolveActions(machine, currentState, currentContext, _event, actions, preserveActionOrder) {
      if (preserveActionOrder === void 0) {
        preserveActionOrder = false;
      }

      var _a = __read(preserveActionOrder ? [[], actions] : partition(actions, function (action) {
        return action.type === assign;
      }), 2),
          assignActions = _a[0],
          otherActions = _a[1];

      var updatedContext = assignActions.length ? updateContext(currentContext, _event, assignActions, currentState) : currentContext;
      var preservedContexts = preserveActionOrder ? [currentContext] : undefined;
      var resolvedActions = flatten(otherActions.map(function (actionObject) {
        var _a;

        switch (actionObject.type) {
          case raise$1:
            return resolveRaise(actionObject);

          case send$1:
            var sendAction = resolveSend(actionObject, updatedContext, _event, machine.options.delays); // TODO: fix ActionTypes.Init

            {
              // warn after resolving as we can create better contextual message here
              warn(!isString(actionObject.delay) || typeof sendAction.delay === 'number', // tslint:disable-next-line:max-line-length
              "No delay reference for delay expression '".concat(actionObject.delay, "' was found on machine '").concat(machine.id, "'"));
            }

            return sendAction;

          case log:
            return resolveLog(actionObject, updatedContext, _event);

          case choose:
            {
              var chooseAction = actionObject;
              var matchedActions = (_a = chooseAction.conds.find(function (condition) {
                var guard = toGuard(condition.cond, machine.options.guards);
                return !guard || evaluateGuard(machine, guard, updatedContext, _event, currentState);
              })) === null || _a === void 0 ? void 0 : _a.actions;

              if (!matchedActions) {
                return [];
              }

              var _b = __read(resolveActions(machine, currentState, updatedContext, _event, toActionObjects(toArray(matchedActions), machine.options.actions), preserveActionOrder), 2),
                  resolvedActionsFromChoose = _b[0],
                  resolvedContextFromChoose = _b[1];

              updatedContext = resolvedContextFromChoose;
              preservedContexts === null || preservedContexts === void 0 ? void 0 : preservedContexts.push(updatedContext);
              return resolvedActionsFromChoose;
            }

          case pure:
            {
              var matchedActions = actionObject.get(updatedContext, _event.data);

              if (!matchedActions) {
                return [];
              }

              var _c = __read(resolveActions(machine, currentState, updatedContext, _event, toActionObjects(toArray(matchedActions), machine.options.actions), preserveActionOrder), 2),
                  resolvedActionsFromPure = _c[0],
                  resolvedContext = _c[1];

              updatedContext = resolvedContext;
              preservedContexts === null || preservedContexts === void 0 ? void 0 : preservedContexts.push(updatedContext);
              return resolvedActionsFromPure;
            }

          case stop$2:
            {
              return resolveStop(actionObject, updatedContext, _event);
            }

          case assign:
            {
              updatedContext = updateContext(updatedContext, _event, [actionObject], currentState);
              preservedContexts === null || preservedContexts === void 0 ? void 0 : preservedContexts.push(updatedContext);
              break;
            }

          default:
            var resolvedActionObject = toActionObject(actionObject, machine.options.actions);
            var exec_1 = resolvedActionObject.exec;

            if (exec_1 && preservedContexts) {
              var contextIndex_1 = preservedContexts.length - 1;
              resolvedActionObject = __assign(__assign({}, resolvedActionObject), {
                exec: function (_ctx) {
                  var args = [];

                  for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                  }

                  exec_1.apply(void 0, __spreadArray([preservedContexts[contextIndex_1]], __read(args), false));
                }
              });
            }

            return resolvedActionObject;
        }
      }).filter(function (a) {
        return !!a;
      }));
      return [resolvedActions, updatedContext];
    }

    var isLeafNode = function (stateNode) {
      return stateNode.type === 'atomic' || stateNode.type === 'final';
    };
    function getChildren(stateNode) {
      return keys(stateNode.states).map(function (key) {
        return stateNode.states[key];
      });
    }
    function getAllStateNodes(stateNode) {
      var stateNodes = [stateNode];

      if (isLeafNode(stateNode)) {
        return stateNodes;
      }

      return stateNodes.concat(flatten(getChildren(stateNode).map(getAllStateNodes)));
    }
    function getConfiguration(prevStateNodes, stateNodes) {
      var e_1, _a, e_2, _b, e_3, _c, e_4, _d;

      var prevConfiguration = new Set(prevStateNodes);
      var prevAdjList = getAdjList(prevConfiguration);
      var configuration = new Set(stateNodes);

      try {
        // add all ancestors
        for (var configuration_1 = __values(configuration), configuration_1_1 = configuration_1.next(); !configuration_1_1.done; configuration_1_1 = configuration_1.next()) {
          var s = configuration_1_1.value;
          var m = s.parent;

          while (m && !configuration.has(m)) {
            configuration.add(m);
            m = m.parent;
          }
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (configuration_1_1 && !configuration_1_1.done && (_a = configuration_1.return)) _a.call(configuration_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      var adjList = getAdjList(configuration);

      try {
        // add descendants
        for (var configuration_2 = __values(configuration), configuration_2_1 = configuration_2.next(); !configuration_2_1.done; configuration_2_1 = configuration_2.next()) {
          var s = configuration_2_1.value; // if previously active, add existing child nodes

          if (s.type === 'compound' && (!adjList.get(s) || !adjList.get(s).length)) {
            if (prevAdjList.get(s)) {
              prevAdjList.get(s).forEach(function (sn) {
                return configuration.add(sn);
              });
            } else {
              s.initialStateNodes.forEach(function (sn) {
                return configuration.add(sn);
              });
            }
          } else {
            if (s.type === 'parallel') {
              try {
                for (var _e = (e_3 = void 0, __values(getChildren(s))), _f = _e.next(); !_f.done; _f = _e.next()) {
                  var child = _f.value;

                  if (child.type === 'history') {
                    continue;
                  }

                  if (!configuration.has(child)) {
                    configuration.add(child);

                    if (prevAdjList.get(child)) {
                      prevAdjList.get(child).forEach(function (sn) {
                        return configuration.add(sn);
                      });
                    } else {
                      child.initialStateNodes.forEach(function (sn) {
                        return configuration.add(sn);
                      });
                    }
                  }
                }
              } catch (e_3_1) {
                e_3 = {
                  error: e_3_1
                };
              } finally {
                try {
                  if (_f && !_f.done && (_c = _e.return)) _c.call(_e);
                } finally {
                  if (e_3) throw e_3.error;
                }
              }
            }
          }
        }
      } catch (e_2_1) {
        e_2 = {
          error: e_2_1
        };
      } finally {
        try {
          if (configuration_2_1 && !configuration_2_1.done && (_b = configuration_2.return)) _b.call(configuration_2);
        } finally {
          if (e_2) throw e_2.error;
        }
      }

      try {
        // add all ancestors
        for (var configuration_3 = __values(configuration), configuration_3_1 = configuration_3.next(); !configuration_3_1.done; configuration_3_1 = configuration_3.next()) {
          var s = configuration_3_1.value;
          var m = s.parent;

          while (m && !configuration.has(m)) {
            configuration.add(m);
            m = m.parent;
          }
        }
      } catch (e_4_1) {
        e_4 = {
          error: e_4_1
        };
      } finally {
        try {
          if (configuration_3_1 && !configuration_3_1.done && (_d = configuration_3.return)) _d.call(configuration_3);
        } finally {
          if (e_4) throw e_4.error;
        }
      }

      return configuration;
    }

    function getValueFromAdj(baseNode, adjList) {
      var childStateNodes = adjList.get(baseNode);

      if (!childStateNodes) {
        return {}; // todo: fix?
      }

      if (baseNode.type === 'compound') {
        var childStateNode = childStateNodes[0];

        if (childStateNode) {
          if (isLeafNode(childStateNode)) {
            return childStateNode.key;
          }
        } else {
          return {};
        }
      }

      var stateValue = {};
      childStateNodes.forEach(function (csn) {
        stateValue[csn.key] = getValueFromAdj(csn, adjList);
      });
      return stateValue;
    }

    function getAdjList(configuration) {
      var e_5, _a;

      var adjList = new Map();

      try {
        for (var configuration_4 = __values(configuration), configuration_4_1 = configuration_4.next(); !configuration_4_1.done; configuration_4_1 = configuration_4.next()) {
          var s = configuration_4_1.value;

          if (!adjList.has(s)) {
            adjList.set(s, []);
          }

          if (s.parent) {
            if (!adjList.has(s.parent)) {
              adjList.set(s.parent, []);
            }

            adjList.get(s.parent).push(s);
          }
        }
      } catch (e_5_1) {
        e_5 = {
          error: e_5_1
        };
      } finally {
        try {
          if (configuration_4_1 && !configuration_4_1.done && (_a = configuration_4.return)) _a.call(configuration_4);
        } finally {
          if (e_5) throw e_5.error;
        }
      }

      return adjList;
    }
    function getValue(rootNode, configuration) {
      var config = getConfiguration([rootNode], configuration);
      return getValueFromAdj(rootNode, getAdjList(config));
    }
    function has(iterable, item) {
      if (Array.isArray(iterable)) {
        return iterable.some(function (member) {
          return member === item;
        });
      }

      if (iterable instanceof Set) {
        return iterable.has(item);
      }

      return false; // TODO: fix
    }
    function nextEvents(configuration) {
      return __spreadArray([], __read(new Set(flatten(__spreadArray([], __read(configuration.map(function (sn) {
        return sn.ownEvents;
      })), false)))), false);
    }
    function isInFinalState(configuration, stateNode) {
      if (stateNode.type === 'compound') {
        return getChildren(stateNode).some(function (s) {
          return s.type === 'final' && has(configuration, s);
        });
      }

      if (stateNode.type === 'parallel') {
        return getChildren(stateNode).every(function (sn) {
          return isInFinalState(configuration, sn);
        });
      }

      return false;
    }
    function getMeta(configuration) {
      if (configuration === void 0) {
        configuration = [];
      }

      return configuration.reduce(function (acc, stateNode) {
        if (stateNode.meta !== undefined) {
          acc[stateNode.id] = stateNode.meta;
        }

        return acc;
      }, {});
    }
    function getTagsFromConfiguration(configuration) {
      return new Set(flatten(configuration.map(function (sn) {
        return sn.tags;
      })));
    }

    function stateValuesEqual(a, b) {
      if (a === b) {
        return true;
      }

      if (a === undefined || b === undefined) {
        return false;
      }

      if (isString(a) || isString(b)) {
        return a === b;
      }

      var aKeys = keys(a);
      var bKeys = keys(b);
      return aKeys.length === bKeys.length && aKeys.every(function (key) {
        return stateValuesEqual(a[key], b[key]);
      });
    }
    function isState(state) {
      if (isString(state)) {
        return false;
      }

      return 'value' in state && 'history' in state;
    }
    function bindActionToState(action, state) {
      var exec = action.exec;

      var boundAction = __assign(__assign({}, action), {
        exec: exec !== undefined ? function () {
          return exec(state.context, state.event, {
            action: action,
            state: state,
            _event: state._event
          });
        } : undefined
      });

      return boundAction;
    }

    var State =
    /*#__PURE__*/

    /** @class */
    function () {
      /**
       * Creates a new State instance.
       * @param value The state value
       * @param context The extended state
       * @param historyValue The tree representing historical values of the state nodes
       * @param history The previous state
       * @param actions An array of action objects to execute as side-effects
       * @param activities A mapping of activities and whether they are started (`true`) or stopped (`false`).
       * @param meta
       * @param events Internal event queue. Should be empty with run-to-completion semantics.
       * @param configuration
       */
      function State(config) {
        var _this = this;

        var _a;

        this.actions = [];
        this.activities = EMPTY_ACTIVITY_MAP;
        this.meta = {};
        this.events = [];
        this.value = config.value;
        this.context = config.context;
        this._event = config._event;
        this._sessionid = config._sessionid;
        this.event = this._event.data;
        this.historyValue = config.historyValue;
        this.history = config.history;
        this.actions = config.actions || [];
        this.activities = config.activities || EMPTY_ACTIVITY_MAP;
        this.meta = getMeta(config.configuration);
        this.events = config.events || [];
        this.matches = this.matches.bind(this);
        this.toStrings = this.toStrings.bind(this);
        this.configuration = config.configuration;
        this.transitions = config.transitions;
        this.children = config.children;
        this.done = !!config.done;
        this.tags = (_a = Array.isArray(config.tags) ? new Set(config.tags) : config.tags) !== null && _a !== void 0 ? _a : new Set();
        this.machine = config.machine;
        Object.defineProperty(this, 'nextEvents', {
          get: function () {
            return nextEvents(_this.configuration);
          }
        });
      }
      /**
       * Creates a new State instance for the given `stateValue` and `context`.
       * @param stateValue
       * @param context
       */


      State.from = function (stateValue, context) {
        if (stateValue instanceof State) {
          if (stateValue.context !== context) {
            return new State({
              value: stateValue.value,
              context: context,
              _event: stateValue._event,
              _sessionid: null,
              historyValue: stateValue.historyValue,
              history: stateValue.history,
              actions: [],
              activities: stateValue.activities,
              meta: {},
              events: [],
              configuration: [],
              transitions: [],
              children: {}
            });
          }

          return stateValue;
        }

        var _event = initEvent;
        return new State({
          value: stateValue,
          context: context,
          _event: _event,
          _sessionid: null,
          historyValue: undefined,
          history: undefined,
          actions: [],
          activities: undefined,
          meta: undefined,
          events: [],
          configuration: [],
          transitions: [],
          children: {}
        });
      };
      /**
       * Creates a new State instance for the given `config`.
       * @param config The state config
       */


      State.create = function (config) {
        return new State(config);
      };
      /**
       * Creates a new `State` instance for the given `stateValue` and `context` with no actions (side-effects).
       * @param stateValue
       * @param context
       */


      State.inert = function (stateValue, context) {
        if (stateValue instanceof State) {
          if (!stateValue.actions.length) {
            return stateValue;
          }

          var _event = initEvent;
          return new State({
            value: stateValue.value,
            context: context,
            _event: _event,
            _sessionid: null,
            historyValue: stateValue.historyValue,
            history: stateValue.history,
            activities: stateValue.activities,
            configuration: stateValue.configuration,
            transitions: [],
            children: {}
          });
        }

        return State.from(stateValue, context);
      };
      /**
       * Returns an array of all the string leaf state node paths.
       * @param stateValue
       * @param delimiter The character(s) that separate each subpath in the string state node path.
       */


      State.prototype.toStrings = function (stateValue, delimiter) {
        var _this = this;

        if (stateValue === void 0) {
          stateValue = this.value;
        }

        if (delimiter === void 0) {
          delimiter = '.';
        }

        if (isString(stateValue)) {
          return [stateValue];
        }

        var valueKeys = keys(stateValue);
        return valueKeys.concat.apply(valueKeys, __spreadArray([], __read(valueKeys.map(function (key) {
          return _this.toStrings(stateValue[key], delimiter).map(function (s) {
            return key + delimiter + s;
          });
        })), false));
      };

      State.prototype.toJSON = function () {
        var _a = this;
            _a.configuration;
            _a.transitions;
            var tags = _a.tags;
            _a.machine;
            var jsonValues = __rest(_a, ["configuration", "transitions", "tags", "machine"]);

        return __assign(__assign({}, jsonValues), {
          tags: Array.from(tags)
        });
      };
      /**
       * Whether the current state value is a subset of the given parent state value.
       * @param parentStateValue
       */


      State.prototype.matches = function (parentStateValue) {
        return matchesState(parentStateValue, this.value);
      };
      /**
       * Whether the current state configuration has a state node with the specified `tag`.
       * @param tag
       */


      State.prototype.hasTag = function (tag) {
        return this.tags.has(tag);
      };
      /**
       * Determines whether sending the `event` will cause a non-forbidden transition
       * to be selected, even if the transitions have no actions nor
       * change the state value.
       *
       * @param event The event to test
       * @returns Whether the event will cause a transition
       */


      State.prototype.can = function (event) {
        var _a;

        var transitionData = (_a = this.machine) === null || _a === void 0 ? void 0 : _a.getTransitionData(this, event);
        return !!(transitionData === null || transitionData === void 0 ? void 0 : transitionData.transitions.length) && // Check that at least one transition is not forbidden
        transitionData.transitions.some(function (t) {
          return t.target !== undefined || t.actions.length;
        });
      };

      return State;
    }();

    /**
     * Maintains a stack of the current service in scope.
     * This is used to provide the correct service to spawn().
     */
    var provide = function (service, fn) {
      var result = fn(service);
      return result;
    };

    function createNullActor(id) {
      return __assign({
        id: id,
        send: function () {
          return void 0;
        },
        subscribe: function () {
          return {
            unsubscribe: function () {
              return void 0;
            }
          };
        },
        getSnapshot: function () {
          return undefined;
        },
        toJSON: function () {
          return {
            id: id
          };
        }
      }, interopSymbols);
    }
    /**
     * Creates a deferred actor that is able to be invoked given the provided
     * invocation information in its `.meta` value.
     *
     * @param invokeDefinition The meta information needed to invoke the actor.
     */

    function createInvocableActor(invokeDefinition, machine, context, _event) {
      var _a;

      var invokeSrc = toInvokeSource$1(invokeDefinition.src);
      var serviceCreator = (_a = machine === null || machine === void 0 ? void 0 : machine.options.services) === null || _a === void 0 ? void 0 : _a[invokeSrc.type];
      var resolvedData = invokeDefinition.data ? mapContext(invokeDefinition.data, context, _event) : undefined;
      var tempActor = serviceCreator ? createDeferredActor(serviceCreator, invokeDefinition.id, resolvedData) : createNullActor(invokeDefinition.id); // @ts-ignore

      tempActor.meta = invokeDefinition;
      return tempActor;
    }
    function createDeferredActor(entity, id, data) {
      var tempActor = createNullActor(id); // @ts-ignore

      tempActor.deferred = true;

      if (isMachine(entity)) {
        // "mute" the existing service scope so potential spawned actors within the `.initialState` stay deferred here
        var initialState_1 = tempActor.state = provide(undefined, function () {
          return (data ? entity.withContext(data) : entity).initialState;
        });

        tempActor.getSnapshot = function () {
          return initialState_1;
        };
      }

      return tempActor;
    }
    function isActor(item) {
      try {
        return typeof item.send === 'function';
      } catch (e) {
        return false;
      }
    }
    function isSpawnedActor(item) {
      return isActor(item) && 'id' in item;
    }
    function toActorRef(actorRefLike) {
      return __assign(__assign({
        subscribe: function () {
          return {
            unsubscribe: function () {
              return void 0;
            }
          };
        },
        id: 'anonymous',
        getSnapshot: function () {
          return undefined;
        }
      }, interopSymbols), actorRefLike);
    }

    function toInvokeSource(src) {
      if (typeof src === 'string') {
        var simpleSrc = {
          type: src
        };

        simpleSrc.toString = function () {
          return src;
        }; // v4 compat - TODO: remove in v5


        return simpleSrc;
      }

      return src;
    }
    function toInvokeDefinition(invokeConfig) {
      return __assign(__assign({
        type: invoke
      }, invokeConfig), {
        toJSON: function () {
          invokeConfig.onDone;
              invokeConfig.onError;
              var invokeDef = __rest(invokeConfig, ["onDone", "onError"]);

          return __assign(__assign({}, invokeDef), {
            type: invoke,
            src: toInvokeSource(invokeConfig.src)
          });
        }
      });
    }

    var NULL_EVENT = '';
    var STATE_IDENTIFIER = '#';
    var WILDCARD = '*';
    var EMPTY_OBJECT = {};

    var isStateId = function (str) {
      return str[0] === STATE_IDENTIFIER;
    };

    var createDefaultOptions = function () {
      return {
        actions: {},
        guards: {},
        services: {},
        activities: {},
        delays: {}
      };
    };

    var validateArrayifiedTransitions = function (stateNode, event, transitions) {
      var hasNonLastUnguardedTarget = transitions.slice(0, -1).some(function (transition) {
        return !('cond' in transition) && !('in' in transition) && (isString(transition.target) || isMachine(transition.target));
      });
      var eventText = event === NULL_EVENT ? 'the transient event' : "event '".concat(event, "'");
      warn(!hasNonLastUnguardedTarget, "One or more transitions for ".concat(eventText, " on state '").concat(stateNode.id, "' are unreachable. ") + "Make sure that the default transition is the last one defined.");
    };

    var StateNode =
    /*#__PURE__*/

    /** @class */
    function () {
      function StateNode(
      /**
       * The raw config used to create the machine.
       */
      config, options,
      /**
       * The initial extended state
       */
      _context, // TODO: this is unsafe, but we're removing it in v5 anyway
      _stateInfo) {
        var _this = this;

        if (_context === void 0) {
          _context = 'context' in config ? config.context : undefined;
        }

        var _a;

        this.config = config;
        this._context = _context;
        /**
         * The order this state node appears. Corresponds to the implicit SCXML document order.
         */

        this.order = -1;
        this.__xstatenode = true;
        this.__cache = {
          events: undefined,
          relativeValue: new Map(),
          initialStateValue: undefined,
          initialState: undefined,
          on: undefined,
          transitions: undefined,
          candidates: {},
          delayedTransitions: undefined
        };
        this.idMap = {};
        this.tags = [];
        this.options = Object.assign(createDefaultOptions(), options);
        this.parent = _stateInfo === null || _stateInfo === void 0 ? void 0 : _stateInfo.parent;
        this.key = this.config.key || (_stateInfo === null || _stateInfo === void 0 ? void 0 : _stateInfo.key) || this.config.id || '(machine)';
        this.machine = this.parent ? this.parent.machine : this;
        this.path = this.parent ? this.parent.path.concat(this.key) : [];
        this.delimiter = this.config.delimiter || (this.parent ? this.parent.delimiter : STATE_DELIMITER);
        this.id = this.config.id || __spreadArray([this.machine.key], __read(this.path), false).join(this.delimiter);
        this.version = this.parent ? this.parent.version : this.config.version;
        this.type = this.config.type || (this.config.parallel ? 'parallel' : this.config.states && keys(this.config.states).length ? 'compound' : this.config.history ? 'history' : 'atomic');
        this.schema = this.parent ? this.machine.schema : (_a = this.config.schema) !== null && _a !== void 0 ? _a : {};
        this.description = this.config.description;

        {
          warn(!('parallel' in this.config), "The \"parallel\" property is deprecated and will be removed in version 4.1. ".concat(this.config.parallel ? "Replace with `type: 'parallel'`" : "Use `type: '".concat(this.type, "'`"), " in the config for state node '").concat(this.id, "' instead."));
        }

        this.initial = this.config.initial;
        this.states = this.config.states ? mapValues(this.config.states, function (stateConfig, key) {
          var _a;

          var stateNode = new StateNode(stateConfig, {}, undefined, {
            parent: _this,
            key: key
          });
          Object.assign(_this.idMap, __assign((_a = {}, _a[stateNode.id] = stateNode, _a), stateNode.idMap));
          return stateNode;
        }) : EMPTY_OBJECT; // Document order

        var order = 0;

        function dfs(stateNode) {
          var e_1, _a;

          stateNode.order = order++;

          try {
            for (var _b = __values(getChildren(stateNode)), _c = _b.next(); !_c.done; _c = _b.next()) {
              var child = _c.value;
              dfs(child);
            }
          } catch (e_1_1) {
            e_1 = {
              error: e_1_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }

        dfs(this); // History config

        this.history = this.config.history === true ? 'shallow' : this.config.history || false;
        this._transient = !!this.config.always || (!this.config.on ? false : Array.isArray(this.config.on) ? this.config.on.some(function (_a) {
          var event = _a.event;
          return event === NULL_EVENT;
        }) : NULL_EVENT in this.config.on);
        this.strict = !!this.config.strict; // TODO: deprecate (entry)

        this.onEntry = toArray(this.config.entry || this.config.onEntry).map(function (action) {
          return toActionObject(action);
        }); // TODO: deprecate (exit)

        this.onExit = toArray(this.config.exit || this.config.onExit).map(function (action) {
          return toActionObject(action);
        });
        this.meta = this.config.meta;
        this.doneData = this.type === 'final' ? this.config.data : undefined;
        this.invoke = toArray(this.config.invoke).map(function (invokeConfig, i) {
          var _a, _b;

          if (isMachine(invokeConfig)) {
            var invokeId = createInvokeId(_this.id, i);
            _this.machine.options.services = __assign((_a = {}, _a[invokeId] = invokeConfig, _a), _this.machine.options.services);
            return toInvokeDefinition({
              src: invokeId,
              id: invokeId
            });
          } else if (isString(invokeConfig.src)) {
            var invokeId = invokeConfig.id || createInvokeId(_this.id, i);
            return toInvokeDefinition(__assign(__assign({}, invokeConfig), {
              id: invokeId,
              src: invokeConfig.src
            }));
          } else if (isMachine(invokeConfig.src) || isFunction(invokeConfig.src)) {
            var invokeId = invokeConfig.id || createInvokeId(_this.id, i);
            _this.machine.options.services = __assign((_b = {}, _b[invokeId] = invokeConfig.src, _b), _this.machine.options.services);
            return toInvokeDefinition(__assign(__assign({
              id: invokeId
            }, invokeConfig), {
              src: invokeId
            }));
          } else {
            var invokeSource = invokeConfig.src;
            return toInvokeDefinition(__assign(__assign({
              id: createInvokeId(_this.id, i)
            }, invokeConfig), {
              src: invokeSource
            }));
          }
        });
        this.activities = toArray(this.config.activities).concat(this.invoke).map(function (activity) {
          return toActivityDefinition(activity);
        });
        this.transition = this.transition.bind(this);
        this.tags = toArray(this.config.tags); // TODO: this is the real fix for initialization once
        // state node getters are deprecated
        // if (!this.parent) {
        //   this._init();
        // }
      }

      StateNode.prototype._init = function () {
        if (this.__cache.transitions) {
          return;
        }

        getAllStateNodes(this).forEach(function (stateNode) {
          return stateNode.on;
        });
      };
      /**
       * Clones this state machine with custom options and context.
       *
       * @param options Options (actions, guards, activities, services) to recursively merge with the existing options.
       * @param context Custom context (will override predefined context)
       */


      StateNode.prototype.withConfig = function (options, context) {
        var _a = this.options,
            actions = _a.actions,
            activities = _a.activities,
            guards = _a.guards,
            services = _a.services,
            delays = _a.delays;
        return new StateNode(this.config, {
          actions: __assign(__assign({}, actions), options.actions),
          activities: __assign(__assign({}, activities), options.activities),
          guards: __assign(__assign({}, guards), options.guards),
          services: __assign(__assign({}, services), options.services),
          delays: __assign(__assign({}, delays), options.delays)
        }, context !== null && context !== void 0 ? context : this.context);
      };
      /**
       * Clones this state machine with custom context.
       *
       * @param context Custom context (will override predefined context, not recursive)
       */


      StateNode.prototype.withContext = function (context) {
        return new StateNode(this.config, this.options, context);
      };

      Object.defineProperty(StateNode.prototype, "context", {
        get: function () {
          return isFunction(this._context) ? this._context() : this._context;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "definition", {
        /**
         * The well-structured state node definition.
         */
        get: function () {
          return {
            id: this.id,
            key: this.key,
            version: this.version,
            context: this.context,
            type: this.type,
            initial: this.initial,
            history: this.history,
            states: mapValues(this.states, function (state) {
              return state.definition;
            }),
            on: this.on,
            transitions: this.transitions,
            entry: this.onEntry,
            exit: this.onExit,
            activities: this.activities || [],
            meta: this.meta,
            order: this.order || -1,
            data: this.doneData,
            invoke: this.invoke,
            description: this.description,
            tags: this.tags
          };
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.toJSON = function () {
        return this.definition;
      };

      Object.defineProperty(StateNode.prototype, "on", {
        /**
         * The mapping of events to transitions.
         */
        get: function () {
          if (this.__cache.on) {
            return this.__cache.on;
          }

          var transitions = this.transitions;
          return this.__cache.on = transitions.reduce(function (map, transition) {
            map[transition.eventType] = map[transition.eventType] || [];
            map[transition.eventType].push(transition);
            return map;
          }, {});
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "after", {
        get: function () {
          return this.__cache.delayedTransitions || (this.__cache.delayedTransitions = this.getDelayedTransitions(), this.__cache.delayedTransitions);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "transitions", {
        /**
         * All the transitions that can be taken from this state node.
         */
        get: function () {
          return this.__cache.transitions || (this.__cache.transitions = this.formatTransitions(), this.__cache.transitions);
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.getCandidates = function (eventName) {
        if (this.__cache.candidates[eventName]) {
          return this.__cache.candidates[eventName];
        }

        var transient = eventName === NULL_EVENT;
        var candidates = this.transitions.filter(function (transition) {
          var sameEventType = transition.eventType === eventName; // null events should only match against eventless transitions

          return transient ? sameEventType : sameEventType || transition.eventType === WILDCARD;
        });
        this.__cache.candidates[eventName] = candidates;
        return candidates;
      };
      /**
       * All delayed transitions from the config.
       */


      StateNode.prototype.getDelayedTransitions = function () {
        var _this = this;

        var afterConfig = this.config.after;

        if (!afterConfig) {
          return [];
        }

        var mutateEntryExit = function (delay, i) {
          var delayRef = isFunction(delay) ? "".concat(_this.id, ":delay[").concat(i, "]") : delay;
          var eventType = after(delayRef, _this.id);

          _this.onEntry.push(send(eventType, {
            delay: delay
          }));

          _this.onExit.push(cancel(eventType));

          return eventType;
        };

        var delayedTransitions = isArray(afterConfig) ? afterConfig.map(function (transition, i) {
          var eventType = mutateEntryExit(transition.delay, i);
          return __assign(__assign({}, transition), {
            event: eventType
          });
        }) : flatten(keys(afterConfig).map(function (delay, i) {
          var configTransition = afterConfig[delay];
          var resolvedTransition = isString(configTransition) ? {
            target: configTransition
          } : configTransition;
          var resolvedDelay = !isNaN(+delay) ? +delay : delay;
          var eventType = mutateEntryExit(resolvedDelay, i);
          return toArray(resolvedTransition).map(function (transition) {
            return __assign(__assign({}, transition), {
              event: eventType,
              delay: resolvedDelay
            });
          });
        }));
        return delayedTransitions.map(function (delayedTransition) {
          var delay = delayedTransition.delay;
          return __assign(__assign({}, _this.formatTransition(delayedTransition)), {
            delay: delay
          });
        });
      };
      /**
       * Returns the state nodes represented by the current state value.
       *
       * @param state The state value or State instance
       */


      StateNode.prototype.getStateNodes = function (state) {
        var _a;

        var _this = this;

        if (!state) {
          return [];
        }

        var stateValue = state instanceof State ? state.value : toStateValue(state, this.delimiter);

        if (isString(stateValue)) {
          var initialStateValue = this.getStateNode(stateValue).initial;
          return initialStateValue !== undefined ? this.getStateNodes((_a = {}, _a[stateValue] = initialStateValue, _a)) : [this, this.states[stateValue]];
        }

        var subStateKeys = keys(stateValue);
        var subStateNodes = [this];
        subStateNodes.push.apply(subStateNodes, __spreadArray([], __read(flatten(subStateKeys.map(function (subStateKey) {
          return _this.getStateNode(subStateKey).getStateNodes(stateValue[subStateKey]);
        }))), false));
        return subStateNodes;
      };
      /**
       * Returns `true` if this state node explicitly handles the given event.
       *
       * @param event The event in question
       */


      StateNode.prototype.handles = function (event) {
        var eventType = getEventType(event);
        return this.events.includes(eventType);
      };
      /**
       * Resolves the given `state` to a new `State` instance relative to this machine.
       *
       * This ensures that `.events` and `.nextEvents` represent the correct values.
       *
       * @param state The state to resolve
       */


      StateNode.prototype.resolveState = function (state) {
        var configuration = Array.from(getConfiguration([], this.getStateNodes(state.value)));
        return new State(__assign(__assign({}, state), {
          value: this.resolve(state.value),
          configuration: configuration,
          done: isInFinalState(configuration, this),
          tags: getTagsFromConfiguration(configuration)
        }));
      };

      StateNode.prototype.transitionLeafNode = function (stateValue, state, _event) {
        var stateNode = this.getStateNode(stateValue);
        var next = stateNode.next(state, _event);

        if (!next || !next.transitions.length) {
          return this.next(state, _event);
        }

        return next;
      };

      StateNode.prototype.transitionCompoundNode = function (stateValue, state, _event) {
        var subStateKeys = keys(stateValue);
        var stateNode = this.getStateNode(subStateKeys[0]);

        var next = stateNode._transition(stateValue[subStateKeys[0]], state, _event);

        if (!next || !next.transitions.length) {
          return this.next(state, _event);
        }

        return next;
      };

      StateNode.prototype.transitionParallelNode = function (stateValue, state, _event) {
        var e_2, _a;

        var transitionMap = {};

        try {
          for (var _b = __values(keys(stateValue)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var subStateKey = _c.value;
            var subStateValue = stateValue[subStateKey];

            if (!subStateValue) {
              continue;
            }

            var subStateNode = this.getStateNode(subStateKey);

            var next = subStateNode._transition(subStateValue, state, _event);

            if (next) {
              transitionMap[subStateKey] = next;
            }
          }
        } catch (e_2_1) {
          e_2 = {
            error: e_2_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_2) throw e_2.error;
          }
        }

        var stateTransitions = keys(transitionMap).map(function (key) {
          return transitionMap[key];
        });
        var enabledTransitions = flatten(stateTransitions.map(function (st) {
          return st.transitions;
        }));
        var willTransition = stateTransitions.some(function (st) {
          return st.transitions.length > 0;
        });

        if (!willTransition) {
          return this.next(state, _event);
        }

        var entryNodes = flatten(stateTransitions.map(function (t) {
          return t.entrySet;
        }));
        var configuration = flatten(keys(transitionMap).map(function (key) {
          return transitionMap[key].configuration;
        }));
        return {
          transitions: enabledTransitions,
          entrySet: entryNodes,
          exitSet: flatten(stateTransitions.map(function (t) {
            return t.exitSet;
          })),
          configuration: configuration,
          source: state,
          actions: flatten(keys(transitionMap).map(function (key) {
            return transitionMap[key].actions;
          }))
        };
      };

      StateNode.prototype._transition = function (stateValue, state, _event) {
        // leaf node
        if (isString(stateValue)) {
          return this.transitionLeafNode(stateValue, state, _event);
        } // hierarchical node


        if (keys(stateValue).length === 1) {
          return this.transitionCompoundNode(stateValue, state, _event);
        } // orthogonal node


        return this.transitionParallelNode(stateValue, state, _event);
      };

      StateNode.prototype.getTransitionData = function (state, event) {
        return this._transition(state.value, state, toSCXMLEvent(event));
      };

      StateNode.prototype.next = function (state, _event) {
        var e_3, _a;

        var _this = this;

        var eventName = _event.name;
        var actions = [];
        var nextStateNodes = [];
        var selectedTransition;

        try {
          for (var _b = __values(this.getCandidates(eventName)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var candidate = _c.value;
            var cond = candidate.cond,
                stateIn = candidate.in;
            var resolvedContext = state.context;
            var isInState = stateIn ? isString(stateIn) && isStateId(stateIn) ? // Check if in state by ID
            state.matches(toStateValue(this.getStateNodeById(stateIn).path, this.delimiter)) : // Check if in state by relative grandparent
            matchesState(toStateValue(stateIn, this.delimiter), path(this.path.slice(0, -2))(state.value)) : true;
            var guardPassed = false;

            try {
              guardPassed = !cond || evaluateGuard(this.machine, cond, resolvedContext, _event, state);
            } catch (err) {
              throw new Error("Unable to evaluate guard '".concat(cond.name || cond.type, "' in transition for event '").concat(eventName, "' in state node '").concat(this.id, "':\n").concat(err.message));
            }

            if (guardPassed && isInState) {
              if (candidate.target !== undefined) {
                nextStateNodes = candidate.target;
              }

              actions.push.apply(actions, __spreadArray([], __read(candidate.actions), false));
              selectedTransition = candidate;
              break;
            }
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        if (!selectedTransition) {
          return undefined;
        }

        if (!nextStateNodes.length) {
          return {
            transitions: [selectedTransition],
            entrySet: [],
            exitSet: [],
            configuration: state.value ? [this] : [],
            source: state,
            actions: actions
          };
        }

        var allNextStateNodes = flatten(nextStateNodes.map(function (stateNode) {
          return _this.getRelativeStateNodes(stateNode, state.historyValue);
        }));
        var isInternal = !!selectedTransition.internal;
        var reentryNodes = isInternal ? [] : flatten(allNextStateNodes.map(function (n) {
          return _this.nodesFromChild(n);
        }));
        return {
          transitions: [selectedTransition],
          entrySet: reentryNodes,
          exitSet: isInternal ? [] : [this],
          configuration: allNextStateNodes,
          source: state,
          actions: actions
        };
      };

      StateNode.prototype.nodesFromChild = function (childStateNode) {
        if (childStateNode.escapes(this)) {
          return [];
        }

        var nodes = [];
        var marker = childStateNode;

        while (marker && marker !== this) {
          nodes.push(marker);
          marker = marker.parent;
        }

        nodes.push(this); // inclusive

        return nodes;
      };
      /**
       * Whether the given state node "escapes" this state node. If the `stateNode` is equal to or the parent of
       * this state node, it does not escape.
       */


      StateNode.prototype.escapes = function (stateNode) {
        if (this === stateNode) {
          return false;
        }

        var parent = this.parent;

        while (parent) {
          if (parent === stateNode) {
            return false;
          }

          parent = parent.parent;
        }

        return true;
      };

      StateNode.prototype.getActions = function (transition, currentContext, _event, prevState) {
        var e_4, _a, e_5, _b;

        var prevConfig = getConfiguration([], prevState ? this.getStateNodes(prevState.value) : [this]);
        var resolvedConfig = transition.configuration.length ? getConfiguration(prevConfig, transition.configuration) : prevConfig;

        try {
          for (var resolvedConfig_1 = __values(resolvedConfig), resolvedConfig_1_1 = resolvedConfig_1.next(); !resolvedConfig_1_1.done; resolvedConfig_1_1 = resolvedConfig_1.next()) {
            var sn = resolvedConfig_1_1.value;

            if (!has(prevConfig, sn)) {
              transition.entrySet.push(sn);
            }
          }
        } catch (e_4_1) {
          e_4 = {
            error: e_4_1
          };
        } finally {
          try {
            if (resolvedConfig_1_1 && !resolvedConfig_1_1.done && (_a = resolvedConfig_1.return)) _a.call(resolvedConfig_1);
          } finally {
            if (e_4) throw e_4.error;
          }
        }

        try {
          for (var prevConfig_1 = __values(prevConfig), prevConfig_1_1 = prevConfig_1.next(); !prevConfig_1_1.done; prevConfig_1_1 = prevConfig_1.next()) {
            var sn = prevConfig_1_1.value;

            if (!has(resolvedConfig, sn) || has(transition.exitSet, sn.parent)) {
              transition.exitSet.push(sn);
            }
          }
        } catch (e_5_1) {
          e_5 = {
            error: e_5_1
          };
        } finally {
          try {
            if (prevConfig_1_1 && !prevConfig_1_1.done && (_b = prevConfig_1.return)) _b.call(prevConfig_1);
          } finally {
            if (e_5) throw e_5.error;
          }
        }

        var doneEvents = flatten(transition.entrySet.map(function (sn) {
          var events = [];

          if (sn.type !== 'final') {
            return events;
          }

          var parent = sn.parent;

          if (!parent.parent) {
            return events;
          }

          events.push(done(sn.id, sn.doneData), // TODO: deprecate - final states should not emit done events for their own state.
          done(parent.id, sn.doneData ? mapContext(sn.doneData, currentContext, _event) : undefined));
          var grandparent = parent.parent;

          if (grandparent.type === 'parallel') {
            if (getChildren(grandparent).every(function (parentNode) {
              return isInFinalState(transition.configuration, parentNode);
            })) {
              events.push(done(grandparent.id));
            }
          }

          return events;
        }));
        transition.exitSet.sort(function (a, b) {
          return b.order - a.order;
        });
        transition.entrySet.sort(function (a, b) {
          return a.order - b.order;
        });
        var entryStates = new Set(transition.entrySet);
        var exitStates = new Set(transition.exitSet);

        var _c = __read([flatten(Array.from(entryStates).map(function (stateNode) {
          return __spreadArray(__spreadArray([], __read(stateNode.activities.map(function (activity) {
            return start(activity);
          })), false), __read(stateNode.onEntry), false);
        })).concat(doneEvents.map(raise)), flatten(Array.from(exitStates).map(function (stateNode) {
          return __spreadArray(__spreadArray([], __read(stateNode.onExit), false), __read(stateNode.activities.map(function (activity) {
            return stop$1(activity);
          })), false);
        }))], 2),
            entryActions = _c[0],
            exitActions = _c[1];

        var actions = toActionObjects(exitActions.concat(transition.actions).concat(entryActions), this.machine.options.actions);
        return actions;
      };
      /**
       * Determines the next state given the current `state` and sent `event`.
       *
       * @param state The current State instance or state value
       * @param event The event that was sent at the current state
       * @param context The current context (extended state) of the current state
       */


      StateNode.prototype.transition = function (state, event, context) {
        if (state === void 0) {
          state = this.initialState;
        }

        var _event = toSCXMLEvent(event);

        var currentState;

        if (state instanceof State) {
          currentState = context === undefined ? state : this.resolveState(State.from(state, context));
        } else {
          var resolvedStateValue = isString(state) ? this.resolve(pathToStateValue(this.getResolvedPath(state))) : this.resolve(state);
          var resolvedContext = context !== null && context !== void 0 ? context : this.machine.context;
          currentState = this.resolveState(State.from(resolvedStateValue, resolvedContext));
        }

        if (!IS_PRODUCTION && _event.name === WILDCARD) {
          throw new Error("An event cannot have the wildcard type ('".concat(WILDCARD, "')"));
        }

        if (this.strict) {
          if (!this.events.includes(_event.name) && !isBuiltInEvent(_event.name)) {
            throw new Error("Machine '".concat(this.id, "' does not accept event '").concat(_event.name, "'"));
          }
        }

        var stateTransition = this._transition(currentState.value, currentState, _event) || {
          transitions: [],
          configuration: [],
          entrySet: [],
          exitSet: [],
          source: currentState,
          actions: []
        };
        var prevConfig = getConfiguration([], this.getStateNodes(currentState.value));
        var resolvedConfig = stateTransition.configuration.length ? getConfiguration(prevConfig, stateTransition.configuration) : prevConfig;
        stateTransition.configuration = __spreadArray([], __read(resolvedConfig), false);
        return this.resolveTransition(stateTransition, currentState, currentState.context, _event);
      };

      StateNode.prototype.resolveRaisedTransition = function (state, _event, originalEvent) {
        var _a;

        var currentActions = state.actions;
        state = this.transition(state, _event); // Save original event to state
        // TODO: this should be the raised event! Delete in V5 (breaking)

        state._event = originalEvent;
        state.event = originalEvent.data;

        (_a = state.actions).unshift.apply(_a, __spreadArray([], __read(currentActions), false));

        return state;
      };

      StateNode.prototype.resolveTransition = function (stateTransition, currentState, context, _event) {
        var e_6, _a;

        var _this = this;

        if (_event === void 0) {
          _event = initEvent;
        }

        var configuration = stateTransition.configuration; // Transition will "apply" if:
        // - this is the initial state (there is no current state)
        // - OR there are transitions

        var willTransition = !currentState || stateTransition.transitions.length > 0;
        var resolvedStateValue = willTransition ? getValue(this.machine, configuration) : undefined;
        var historyValue = currentState ? currentState.historyValue ? currentState.historyValue : stateTransition.source ? this.machine.historyValue(currentState.value) : undefined : undefined;
        var actions = this.getActions(stateTransition, context, _event, currentState);
        var activities = currentState ? __assign({}, currentState.activities) : {};

        try {
          for (var actions_1 = __values(actions), actions_1_1 = actions_1.next(); !actions_1_1.done; actions_1_1 = actions_1.next()) {
            var action = actions_1_1.value;

            if (action.type === start$1) {
              activities[action.activity.id || action.activity.type] = action;
            } else if (action.type === stop$2) {
              activities[action.activity.id || action.activity.type] = false;
            }
          }
        } catch (e_6_1) {
          e_6 = {
            error: e_6_1
          };
        } finally {
          try {
            if (actions_1_1 && !actions_1_1.done && (_a = actions_1.return)) _a.call(actions_1);
          } finally {
            if (e_6) throw e_6.error;
          }
        }

        var _b = __read(resolveActions(this, currentState, context, _event, actions, this.machine.config.preserveActionOrder), 2),
            resolvedActions = _b[0],
            updatedContext = _b[1];

        var _c = __read(partition(resolvedActions, function (action) {
          return action.type === raise$1 || action.type === send$1 && action.to === SpecialTargets.Internal;
        }), 2),
            raisedEvents = _c[0],
            nonRaisedActions = _c[1];

        var invokeActions = resolvedActions.filter(function (action) {
          var _a;

          return action.type === start$1 && ((_a = action.activity) === null || _a === void 0 ? void 0 : _a.type) === invoke;
        });
        var children = invokeActions.reduce(function (acc, action) {
          acc[action.activity.id] = createInvocableActor(action.activity, _this.machine, updatedContext, _event);
          return acc;
        }, currentState ? __assign({}, currentState.children) : {});
        var resolvedConfiguration = willTransition ? stateTransition.configuration : currentState ? currentState.configuration : [];
        var isDone = isInFinalState(resolvedConfiguration, this);
        var nextState = new State({
          value: resolvedStateValue || currentState.value,
          context: updatedContext,
          _event: _event,
          // Persist _sessionid between states
          _sessionid: currentState ? currentState._sessionid : null,
          historyValue: resolvedStateValue ? historyValue ? updateHistoryValue(historyValue, resolvedStateValue) : undefined : currentState ? currentState.historyValue : undefined,
          history: !resolvedStateValue || stateTransition.source ? currentState : undefined,
          actions: resolvedStateValue ? nonRaisedActions : [],
          activities: resolvedStateValue ? activities : currentState ? currentState.activities : {},
          events: [],
          configuration: resolvedConfiguration,
          transitions: stateTransition.transitions,
          children: children,
          done: isDone,
          tags: currentState === null || currentState === void 0 ? void 0 : currentState.tags,
          machine: this
        });
        var didUpdateContext = context !== updatedContext;
        nextState.changed = _event.name === update || didUpdateContext; // Dispose of penultimate histories to prevent memory leaks

        var history = nextState.history;

        if (history) {
          delete history.history;
        } // There are transient transitions if the machine is not in a final state
        // and if some of the state nodes have transient ("always") transitions.


        var isTransient = !isDone && (this._transient || configuration.some(function (stateNode) {
          return stateNode._transient;
        })); // If there are no enabled transitions, check if there are transient transitions.
        // If there are transient transitions, continue checking for more transitions
        // because an transient transition should be triggered even if there are no
        // enabled transitions.
        //
        // If we're already working on an transient transition (by checking
        // if the event is a NULL_EVENT), then stop to prevent an infinite loop.
        //
        // Otherwise, if there are no enabled nor transient transitions, we are done.

        if (!willTransition && (!isTransient || _event.name === NULL_EVENT)) {
          return nextState;
        }

        var maybeNextState = nextState;

        if (!isDone) {
          if (isTransient) {
            maybeNextState = this.resolveRaisedTransition(maybeNextState, {
              type: nullEvent
            }, _event);
          }

          while (raisedEvents.length) {
            var raisedEvent = raisedEvents.shift();
            maybeNextState = this.resolveRaisedTransition(maybeNextState, raisedEvent._event, _event);
          }
        } // Detect if state changed


        var changed = maybeNextState.changed || (history ? !!maybeNextState.actions.length || didUpdateContext || typeof history.value !== typeof maybeNextState.value || !stateValuesEqual(maybeNextState.value, history.value) : undefined);
        maybeNextState.changed = changed; // Preserve original history after raised events

        maybeNextState.history = history;
        maybeNextState.tags = getTagsFromConfiguration(maybeNextState.configuration);
        return maybeNextState;
      };
      /**
       * Returns the child state node from its relative `stateKey`, or throws.
       */


      StateNode.prototype.getStateNode = function (stateKey) {
        if (isStateId(stateKey)) {
          return this.machine.getStateNodeById(stateKey);
        }

        if (!this.states) {
          throw new Error("Unable to retrieve child state '".concat(stateKey, "' from '").concat(this.id, "'; no child states exist."));
        }

        var result = this.states[stateKey];

        if (!result) {
          throw new Error("Child state '".concat(stateKey, "' does not exist on '").concat(this.id, "'"));
        }

        return result;
      };
      /**
       * Returns the state node with the given `stateId`, or throws.
       *
       * @param stateId The state ID. The prefix "#" is removed.
       */


      StateNode.prototype.getStateNodeById = function (stateId) {
        var resolvedStateId = isStateId(stateId) ? stateId.slice(STATE_IDENTIFIER.length) : stateId;

        if (resolvedStateId === this.id) {
          return this;
        }

        var stateNode = this.machine.idMap[resolvedStateId];

        if (!stateNode) {
          throw new Error("Child state node '#".concat(resolvedStateId, "' does not exist on machine '").concat(this.id, "'"));
        }

        return stateNode;
      };
      /**
       * Returns the relative state node from the given `statePath`, or throws.
       *
       * @param statePath The string or string array relative path to the state node.
       */


      StateNode.prototype.getStateNodeByPath = function (statePath) {
        if (typeof statePath === 'string' && isStateId(statePath)) {
          try {
            return this.getStateNodeById(statePath.slice(1));
          } catch (e) {// try individual paths
            // throw e;
          }
        }

        var arrayStatePath = toStatePath(statePath, this.delimiter).slice();
        var currentStateNode = this;

        while (arrayStatePath.length) {
          var key = arrayStatePath.shift();

          if (!key.length) {
            break;
          }

          currentStateNode = currentStateNode.getStateNode(key);
        }

        return currentStateNode;
      };
      /**
       * Resolves a partial state value with its full representation in this machine.
       *
       * @param stateValue The partial state value to resolve.
       */


      StateNode.prototype.resolve = function (stateValue) {
        var _a;

        var _this = this;

        if (!stateValue) {
          return this.initialStateValue || EMPTY_OBJECT; // TODO: type-specific properties
        }

        switch (this.type) {
          case 'parallel':
            return mapValues(this.initialStateValue, function (subStateValue, subStateKey) {
              return subStateValue ? _this.getStateNode(subStateKey).resolve(stateValue[subStateKey] || subStateValue) : EMPTY_OBJECT;
            });

          case 'compound':
            if (isString(stateValue)) {
              var subStateNode = this.getStateNode(stateValue);

              if (subStateNode.type === 'parallel' || subStateNode.type === 'compound') {
                return _a = {}, _a[stateValue] = subStateNode.initialStateValue, _a;
              }

              return stateValue;
            }

            if (!keys(stateValue).length) {
              return this.initialStateValue || {};
            }

            return mapValues(stateValue, function (subStateValue, subStateKey) {
              return subStateValue ? _this.getStateNode(subStateKey).resolve(subStateValue) : EMPTY_OBJECT;
            });

          default:
            return stateValue || EMPTY_OBJECT;
        }
      };

      StateNode.prototype.getResolvedPath = function (stateIdentifier) {
        if (isStateId(stateIdentifier)) {
          var stateNode = this.machine.idMap[stateIdentifier.slice(STATE_IDENTIFIER.length)];

          if (!stateNode) {
            throw new Error("Unable to find state node '".concat(stateIdentifier, "'"));
          }

          return stateNode.path;
        }

        return toStatePath(stateIdentifier, this.delimiter);
      };

      Object.defineProperty(StateNode.prototype, "initialStateValue", {
        get: function () {
          var _a;

          if (this.__cache.initialStateValue) {
            return this.__cache.initialStateValue;
          }

          var initialStateValue;

          if (this.type === 'parallel') {
            initialStateValue = mapFilterValues(this.states, function (state) {
              return state.initialStateValue || EMPTY_OBJECT;
            }, function (stateNode) {
              return !(stateNode.type === 'history');
            });
          } else if (this.initial !== undefined) {
            if (!this.states[this.initial]) {
              throw new Error("Initial state '".concat(this.initial, "' not found on '").concat(this.key, "'"));
            }

            initialStateValue = isLeafNode(this.states[this.initial]) ? this.initial : (_a = {}, _a[this.initial] = this.states[this.initial].initialStateValue, _a);
          } else {
            // The finite state value of a machine without child states is just an empty object
            initialStateValue = {};
          }

          this.__cache.initialStateValue = initialStateValue;
          return this.__cache.initialStateValue;
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.getInitialState = function (stateValue, context) {
        var configuration = this.getStateNodes(stateValue);
        return this.resolveTransition({
          configuration: configuration,
          entrySet: configuration,
          exitSet: [],
          transitions: [],
          source: undefined,
          actions: []
        }, undefined, context !== null && context !== void 0 ? context : this.machine.context, undefined);
      };

      Object.defineProperty(StateNode.prototype, "initialState", {
        /**
         * The initial State instance, which includes all actions to be executed from
         * entering the initial state.
         */
        get: function () {
          this._init(); // TODO: this should be in the constructor (see note in constructor)


          var initialStateValue = this.initialStateValue;

          if (!initialStateValue) {
            throw new Error("Cannot retrieve initial state from simple state '".concat(this.id, "'."));
          }

          return this.getInitialState(initialStateValue);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "target", {
        /**
         * The target state value of the history state node, if it exists. This represents the
         * default state value to transition to if no history value exists yet.
         */
        get: function () {
          var target;

          if (this.type === 'history') {
            var historyConfig = this.config;

            if (isString(historyConfig.target)) {
              target = isStateId(historyConfig.target) ? pathToStateValue(this.machine.getStateNodeById(historyConfig.target).path.slice(this.path.length - 1)) : historyConfig.target;
            } else {
              target = historyConfig.target;
            }
          }

          return target;
        },
        enumerable: false,
        configurable: true
      });
      /**
       * Returns the leaf nodes from a state path relative to this state node.
       *
       * @param relativeStateId The relative state path to retrieve the state nodes
       * @param history The previous state to retrieve history
       * @param resolve Whether state nodes should resolve to initial child state nodes
       */

      StateNode.prototype.getRelativeStateNodes = function (relativeStateId, historyValue, resolve) {
        if (resolve === void 0) {
          resolve = true;
        }

        return resolve ? relativeStateId.type === 'history' ? relativeStateId.resolveHistory(historyValue) : relativeStateId.initialStateNodes : [relativeStateId];
      };

      Object.defineProperty(StateNode.prototype, "initialStateNodes", {
        get: function () {
          var _this = this;

          if (isLeafNode(this)) {
            return [this];
          } // Case when state node is compound but no initial state is defined


          if (this.type === 'compound' && !this.initial) {
            if (!IS_PRODUCTION) {
              warn(false, "Compound state node '".concat(this.id, "' has no initial state."));
            }

            return [this];
          }

          var initialStateNodePaths = toStatePaths(this.initialStateValue);
          return flatten(initialStateNodePaths.map(function (initialPath) {
            return _this.getFromRelativePath(initialPath);
          }));
        },
        enumerable: false,
        configurable: true
      });
      /**
       * Retrieves state nodes from a relative path to this state node.
       *
       * @param relativePath The relative path from this state node
       * @param historyValue
       */

      StateNode.prototype.getFromRelativePath = function (relativePath) {
        if (!relativePath.length) {
          return [this];
        }

        var _a = __read(relativePath),
            stateKey = _a[0],
            childStatePath = _a.slice(1);

        if (!this.states) {
          throw new Error("Cannot retrieve subPath '".concat(stateKey, "' from node with no states"));
        }

        var childStateNode = this.getStateNode(stateKey);

        if (childStateNode.type === 'history') {
          return childStateNode.resolveHistory();
        }

        if (!this.states[stateKey]) {
          throw new Error("Child state '".concat(stateKey, "' does not exist on '").concat(this.id, "'"));
        }

        return this.states[stateKey].getFromRelativePath(childStatePath);
      };

      StateNode.prototype.historyValue = function (relativeStateValue) {
        if (!keys(this.states).length) {
          return undefined;
        }

        return {
          current: relativeStateValue || this.initialStateValue,
          states: mapFilterValues(this.states, function (stateNode, key) {
            if (!relativeStateValue) {
              return stateNode.historyValue();
            }

            var subStateValue = isString(relativeStateValue) ? undefined : relativeStateValue[key];
            return stateNode.historyValue(subStateValue || stateNode.initialStateValue);
          }, function (stateNode) {
            return !stateNode.history;
          })
        };
      };
      /**
       * Resolves to the historical value(s) of the parent state node,
       * represented by state nodes.
       *
       * @param historyValue
       */


      StateNode.prototype.resolveHistory = function (historyValue) {
        var _this = this;

        if (this.type !== 'history') {
          return [this];
        }

        var parent = this.parent;

        if (!historyValue) {
          var historyTarget = this.target;
          return historyTarget ? flatten(toStatePaths(historyTarget).map(function (relativeChildPath) {
            return parent.getFromRelativePath(relativeChildPath);
          })) : parent.initialStateNodes;
        }

        var subHistoryValue = nestedPath(parent.path, 'states')(historyValue).current;

        if (isString(subHistoryValue)) {
          return [parent.getStateNode(subHistoryValue)];
        }

        return flatten(toStatePaths(subHistoryValue).map(function (subStatePath) {
          return _this.history === 'deep' ? parent.getFromRelativePath(subStatePath) : [parent.states[subStatePath[0]]];
        }));
      };

      Object.defineProperty(StateNode.prototype, "stateIds", {
        /**
         * All the state node IDs of this state node and its descendant state nodes.
         */
        get: function () {
          var _this = this;

          var childStateIds = flatten(keys(this.states).map(function (stateKey) {
            return _this.states[stateKey].stateIds;
          }));
          return [this.id].concat(childStateIds);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "events", {
        /**
         * All the event types accepted by this state node and its descendants.
         */
        get: function () {
          var e_7, _a, e_8, _b;

          if (this.__cache.events) {
            return this.__cache.events;
          }

          var states = this.states;
          var events = new Set(this.ownEvents);

          if (states) {
            try {
              for (var _c = __values(keys(states)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var stateId = _d.value;
                var state = states[stateId];

                if (state.states) {
                  try {
                    for (var _e = (e_8 = void 0, __values(state.events)), _f = _e.next(); !_f.done; _f = _e.next()) {
                      var event_1 = _f.value;
                      events.add("".concat(event_1));
                    }
                  } catch (e_8_1) {
                    e_8 = {
                      error: e_8_1
                    };
                  } finally {
                    try {
                      if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    } finally {
                      if (e_8) throw e_8.error;
                    }
                  }
                }
              }
            } catch (e_7_1) {
              e_7 = {
                error: e_7_1
              };
            } finally {
              try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
              } finally {
                if (e_7) throw e_7.error;
              }
            }
          }

          return this.__cache.events = Array.from(events);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "ownEvents", {
        /**
         * All the events that have transitions directly from this state node.
         *
         * Excludes any inert events.
         */
        get: function () {
          var events = new Set(this.transitions.filter(function (transition) {
            return !(!transition.target && !transition.actions.length && transition.internal);
          }).map(function (transition) {
            return transition.eventType;
          }));
          return Array.from(events);
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.resolveTarget = function (_target) {
        var _this = this;

        if (_target === undefined) {
          // an undefined target signals that the state node should not transition from that state when receiving that event
          return undefined;
        }

        return _target.map(function (target) {
          if (!isString(target)) {
            return target;
          }

          var isInternalTarget = target[0] === _this.delimiter; // If internal target is defined on machine,
          // do not include machine key on target

          if (isInternalTarget && !_this.parent) {
            return _this.getStateNodeByPath(target.slice(1));
          }

          var resolvedTarget = isInternalTarget ? _this.key + target : target;

          if (_this.parent) {
            try {
              var targetStateNode = _this.parent.getStateNodeByPath(resolvedTarget);

              return targetStateNode;
            } catch (err) {
              throw new Error("Invalid transition definition for state node '".concat(_this.id, "':\n").concat(err.message));
            }
          } else {
            return _this.getStateNodeByPath(resolvedTarget);
          }
        });
      };

      StateNode.prototype.formatTransition = function (transitionConfig) {
        var _this = this;

        var normalizedTarget = normalizeTarget(transitionConfig.target);
        var internal = 'internal' in transitionConfig ? transitionConfig.internal : normalizedTarget ? normalizedTarget.some(function (_target) {
          return isString(_target) && _target[0] === _this.delimiter;
        }) : true;
        var guards = this.machine.options.guards;
        var target = this.resolveTarget(normalizedTarget);

        var transition = __assign(__assign({}, transitionConfig), {
          actions: toActionObjects(toArray(transitionConfig.actions)),
          cond: toGuard(transitionConfig.cond, guards),
          target: target,
          source: this,
          internal: internal,
          eventType: transitionConfig.event,
          toJSON: function () {
            return __assign(__assign({}, transition), {
              target: transition.target ? transition.target.map(function (t) {
                return "#".concat(t.id);
              }) : undefined,
              source: "#".concat(_this.id)
            });
          }
        });

        return transition;
      };

      StateNode.prototype.formatTransitions = function () {
        var e_9, _a;

        var _this = this;

        var onConfig;

        if (!this.config.on) {
          onConfig = [];
        } else if (Array.isArray(this.config.on)) {
          onConfig = this.config.on;
        } else {
          var _b = this.config.on,
              _c = WILDCARD,
              _d = _b[_c],
              wildcardConfigs = _d === void 0 ? [] : _d,
              strictTransitionConfigs_1 = __rest(_b, [typeof _c === "symbol" ? _c : _c + ""]);

          onConfig = flatten(keys(strictTransitionConfigs_1).map(function (key) {
            if (!IS_PRODUCTION && key === NULL_EVENT) {
              warn(false, "Empty string transition configs (e.g., `{ on: { '': ... }}`) for transient transitions are deprecated. Specify the transition in the `{ always: ... }` property instead. " + "Please check the `on` configuration for \"#".concat(_this.id, "\"."));
            }

            var transitionConfigArray = toTransitionConfigArray(key, strictTransitionConfigs_1[key]);

            if (!IS_PRODUCTION) {
              validateArrayifiedTransitions(_this, key, transitionConfigArray);
            }

            return transitionConfigArray;
          }).concat(toTransitionConfigArray(WILDCARD, wildcardConfigs)));
        }

        var eventlessConfig = this.config.always ? toTransitionConfigArray('', this.config.always) : [];
        var doneConfig = this.config.onDone ? toTransitionConfigArray(String(done(this.id)), this.config.onDone) : [];

        if (!IS_PRODUCTION) {
          warn(!(this.config.onDone && !this.parent), "Root nodes cannot have an \".onDone\" transition. Please check the config of \"".concat(this.id, "\"."));
        }

        var invokeConfig = flatten(this.invoke.map(function (invokeDef) {
          var settleTransitions = [];

          if (invokeDef.onDone) {
            settleTransitions.push.apply(settleTransitions, __spreadArray([], __read(toTransitionConfigArray(String(doneInvoke(invokeDef.id)), invokeDef.onDone)), false));
          }

          if (invokeDef.onError) {
            settleTransitions.push.apply(settleTransitions, __spreadArray([], __read(toTransitionConfigArray(String(error(invokeDef.id)), invokeDef.onError)), false));
          }

          return settleTransitions;
        }));
        var delayedTransitions = this.after;
        var formattedTransitions = flatten(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(doneConfig), false), __read(invokeConfig), false), __read(onConfig), false), __read(eventlessConfig), false).map(function (transitionConfig) {
          return toArray(transitionConfig).map(function (transition) {
            return _this.formatTransition(transition);
          });
        }));

        try {
          for (var delayedTransitions_1 = __values(delayedTransitions), delayedTransitions_1_1 = delayedTransitions_1.next(); !delayedTransitions_1_1.done; delayedTransitions_1_1 = delayedTransitions_1.next()) {
            var delayedTransition = delayedTransitions_1_1.value;
            formattedTransitions.push(delayedTransition);
          }
        } catch (e_9_1) {
          e_9 = {
            error: e_9_1
          };
        } finally {
          try {
            if (delayedTransitions_1_1 && !delayedTransitions_1_1.done && (_a = delayedTransitions_1.return)) _a.call(delayedTransitions_1);
          } finally {
            if (e_9) throw e_9.error;
          }
        }

        return formattedTransitions;
      };

      return StateNode;
    }();

    function createMachine(config, options) {
      return new StateNode(config, options);
    }

    var defaultOptions = {
      deferEvents: false
    };

    var Scheduler =
    /*#__PURE__*/

    /** @class */
    function () {
      function Scheduler(options) {
        this.processingEvent = false;
        this.queue = [];
        this.initialized = false;
        this.options = __assign(__assign({}, defaultOptions), options);
      }

      Scheduler.prototype.initialize = function (callback) {
        this.initialized = true;

        if (callback) {
          if (!this.options.deferEvents) {
            this.schedule(callback);
            return;
          }

          this.process(callback);
        }

        this.flushEvents();
      };

      Scheduler.prototype.schedule = function (task) {
        if (!this.initialized || this.processingEvent) {
          this.queue.push(task);
          return;
        }

        if (this.queue.length !== 0) {
          throw new Error('Event queue should be empty when it is not processing events');
        }

        this.process(task);
        this.flushEvents();
      };

      Scheduler.prototype.clear = function () {
        this.queue = [];
      };

      Scheduler.prototype.flushEvents = function () {
        var nextCallback = this.queue.shift();

        while (nextCallback) {
          this.process(nextCallback);
          nextCallback = this.queue.shift();
        }
      };

      Scheduler.prototype.process = function (callback) {
        this.processingEvent = true;

        try {
          callback();
        } catch (e) {
          // there is no use to keep the future events
          // as the situation is not anymore the same
          this.clear();
          throw e;
        } finally {
          this.processingEvent = false;
        }
      };

      return Scheduler;
    }();

    var children = /*#__PURE__*/new Map();
    var sessionIdIndex = 0;
    var registry = {
      bookId: function () {
        return "x:".concat(sessionIdIndex++);
      },
      register: function (id, actor) {
        children.set(id, actor);
        return id;
      },
      get: function (id) {
        return children.get(id);
      },
      free: function (id) {
        children.delete(id);
      }
    };

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis
    function getGlobal() {
      if (typeof globalThis !== 'undefined') {
        return globalThis;
      }

      if (typeof self !== 'undefined') {
        return self;
      }

      if (typeof window !== 'undefined') {
        return window;
      }

      if (typeof global !== 'undefined') {
        return global;
      }

      return undefined;
    }

    function getDevTools() {
      var global = getGlobal();

      if (global && '__xstate__' in global) {
        return global.__xstate__;
      }

      return undefined;
    }

    function registerService(service) {
      if (!getGlobal()) {
        return;
      }

      var devTools = getDevTools();

      if (devTools) {
        devTools.register(service);
      }
    }

    function spawnBehavior(behavior, options) {
      if (options === void 0) {
        options = {};
      }

      var state = behavior.initialState;
      var observers = new Set();
      var mailbox = [];
      var flushing = false;

      var flush = function () {
        if (flushing) {
          return;
        }

        flushing = true;

        while (mailbox.length > 0) {
          var event_1 = mailbox.shift();
          state = behavior.transition(state, event_1, actorCtx);
          observers.forEach(function (observer) {
            return observer.next(state);
          });
        }

        flushing = false;
      };

      var actor = toActorRef({
        id: options.id,
        send: function (event) {
          mailbox.push(event);
          flush();
        },
        getSnapshot: function () {
          return state;
        },
        subscribe: function (next, handleError, complete) {
          var observer = toObserver(next, handleError, complete);
          observers.add(observer);
          observer.next(state);
          return {
            unsubscribe: function () {
              observers.delete(observer);
            }
          };
        }
      });
      var actorCtx = {
        parent: options.parent,
        self: actor,
        id: options.id || 'anonymous',
        observers: observers
      };
      state = behavior.start ? behavior.start(actorCtx) : state;
      return actor;
    }

    var DEFAULT_SPAWN_OPTIONS = {
      sync: false,
      autoForward: false
    };
    var InterpreterStatus;

    (function (InterpreterStatus) {
      InterpreterStatus[InterpreterStatus["NotStarted"] = 0] = "NotStarted";
      InterpreterStatus[InterpreterStatus["Running"] = 1] = "Running";
      InterpreterStatus[InterpreterStatus["Stopped"] = 2] = "Stopped";
    })(InterpreterStatus || (InterpreterStatus = {}));

    var Interpreter =
    /*#__PURE__*/

    /** @class */
    function () {
      /**
       * Creates a new Interpreter instance (i.e., service) for the given machine with the provided options, if any.
       *
       * @param machine The machine to be interpreted
       * @param options Interpreter options
       */
      function Interpreter(machine, options) {
        var _this = this;

        if (options === void 0) {
          options = Interpreter.defaultOptions;
        }

        this.machine = machine;
        this.scheduler = new Scheduler();
        this.delayedEventsMap = {};
        this.listeners = new Set();
        this.contextListeners = new Set();
        this.stopListeners = new Set();
        this.doneListeners = new Set();
        this.eventListeners = new Set();
        this.sendListeners = new Set();
        /**
         * Whether the service is started.
         */

        this.initialized = false;
        this.status = InterpreterStatus.NotStarted;
        this.children = new Map();
        this.forwardTo = new Set();
        /**
         * Alias for Interpreter.prototype.start
         */

        this.init = this.start;
        /**
         * Sends an event to the running interpreter to trigger a transition.
         *
         * An array of events (batched) can be sent as well, which will send all
         * batched events to the running interpreter. The listeners will be
         * notified only **once** when all events are processed.
         *
         * @param event The event(s) to send
         */

        this.send = function (event, payload) {
          if (isArray(event)) {
            _this.batch(event);

            return _this.state;
          }

          var _event = toSCXMLEvent(toEventObject(event, payload));

          if (_this.status === InterpreterStatus.Stopped) {
            // do nothing
            {
              warn(false, "Event \"".concat(_event.name, "\" was sent to stopped service \"").concat(_this.machine.id, "\". This service has already reached its final state, and will not transition.\nEvent: ").concat(JSON.stringify(_event.data)));
            }

            return _this.state;
          }

          if (_this.status !== InterpreterStatus.Running && !_this.options.deferEvents) {
            throw new Error("Event \"".concat(_event.name, "\" was sent to uninitialized service \"").concat(_this.machine.id // tslint:disable-next-line:max-line-length
            , "\". Make sure .start() is called for this service, or set { deferEvents: true } in the service options.\nEvent: ").concat(JSON.stringify(_event.data)));
          }

          _this.scheduler.schedule(function () {
            // Forward copy of event to child actors
            _this.forward(_event);

            var nextState = _this.nextState(_event);

            _this.update(nextState, _event);
          });

          return _this._state; // TODO: deprecate (should return void)
          // tslint:disable-next-line:semicolon
        };

        this.sendTo = function (event, to) {
          var isParent = _this.parent && (to === SpecialTargets.Parent || _this.parent.id === to);
          var target = isParent ? _this.parent : isString(to) ? _this.children.get(to) || registry.get(to) : isActor$1(to) ? to : undefined;

          if (!target) {
            if (!isParent) {
              throw new Error("Unable to send event to child '".concat(to, "' from service '").concat(_this.id, "'."));
            } // tslint:disable-next-line:no-console


            {
              warn(false, "Service '".concat(_this.id, "' has no parent: unable to send event ").concat(event.type));
            }

            return;
          }

          if ('machine' in target) {
            // Send SCXML events to machines
            target.send(__assign(__assign({}, event), {
              name: event.name === error$1 ? "".concat(error(_this.id)) : event.name,
              origin: _this.sessionId
            }));
          } else {
            // Send normal events to other targets
            target.send(event.data);
          }
        };

        var resolvedOptions = __assign(__assign({}, Interpreter.defaultOptions), options);

        var clock = resolvedOptions.clock,
            logger = resolvedOptions.logger,
            parent = resolvedOptions.parent,
            id = resolvedOptions.id;
        var resolvedId = id !== undefined ? id : machine.id;
        this.id = resolvedId;
        this.logger = logger;
        this.clock = clock;
        this.parent = parent;
        this.options = resolvedOptions;
        this.scheduler = new Scheduler({
          deferEvents: this.options.deferEvents
        });
        this.sessionId = registry.bookId();
      }

      Object.defineProperty(Interpreter.prototype, "initialState", {
        get: function () {
          var _this = this;

          if (this._initialState) {
            return this._initialState;
          }

          return provide(this, function () {
            _this._initialState = _this.machine.initialState;
            return _this._initialState;
          });
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Interpreter.prototype, "state", {
        get: function () {
          {
            warn(this.status !== InterpreterStatus.NotStarted, "Attempted to read state from uninitialized service '".concat(this.id, "'. Make sure the service is started first."));
          }

          return this._state;
        },
        enumerable: false,
        configurable: true
      });
      /**
       * Executes the actions of the given state, with that state's `context` and `event`.
       *
       * @param state The state whose actions will be executed
       * @param actionsConfig The action implementations to use
       */

      Interpreter.prototype.execute = function (state, actionsConfig) {
        var e_1, _a;

        try {
          for (var _b = __values(state.actions), _c = _b.next(); !_c.done; _c = _b.next()) {
            var action = _c.value;
            this.exec(action, state, actionsConfig);
          }
        } catch (e_1_1) {
          e_1 = {
            error: e_1_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
      };

      Interpreter.prototype.update = function (state, _event) {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d;

        var _this = this; // Attach session ID to state


        state._sessionid = this.sessionId; // Update state

        this._state = state; // Execute actions

        if (this.options.execute) {
          this.execute(this.state);
        } // Update children


        this.children.forEach(function (child) {
          _this.state.children[child.id] = child;
        }); // Dev tools

        if (this.devTools) {
          this.devTools.send(_event.data, state);
        } // Execute listeners


        if (state.event) {
          try {
            for (var _e = __values(this.eventListeners), _f = _e.next(); !_f.done; _f = _e.next()) {
              var listener = _f.value;
              listener(state.event);
            }
          } catch (e_2_1) {
            e_2 = {
              error: e_2_1
            };
          } finally {
            try {
              if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
        }

        try {
          for (var _g = __values(this.listeners), _h = _g.next(); !_h.done; _h = _g.next()) {
            var listener = _h.value;
            listener(state, state.event);
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        try {
          for (var _j = __values(this.contextListeners), _k = _j.next(); !_k.done; _k = _j.next()) {
            var contextListener = _k.value;
            contextListener(this.state.context, this.state.history ? this.state.history.context : undefined);
          }
        } catch (e_4_1) {
          e_4 = {
            error: e_4_1
          };
        } finally {
          try {
            if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
          } finally {
            if (e_4) throw e_4.error;
          }
        }

        var isDone = isInFinalState(state.configuration || [], this.machine);

        if (this.state.configuration && isDone) {
          // get final child state node
          var finalChildStateNode = state.configuration.find(function (sn) {
            return sn.type === 'final' && sn.parent === _this.machine;
          });
          var doneData = finalChildStateNode && finalChildStateNode.doneData ? mapContext(finalChildStateNode.doneData, state.context, _event) : undefined;

          try {
            for (var _l = __values(this.doneListeners), _m = _l.next(); !_m.done; _m = _l.next()) {
              var listener = _m.value;
              listener(doneInvoke(this.id, doneData));
            }
          } catch (e_5_1) {
            e_5 = {
              error: e_5_1
            };
          } finally {
            try {
              if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
            } finally {
              if (e_5) throw e_5.error;
            }
          }

          this.stop();
        }
      };
      /*
       * Adds a listener that is notified whenever a state transition happens. The listener is called with
       * the next state and the event object that caused the state transition.
       *
       * @param listener The state listener
       */


      Interpreter.prototype.onTransition = function (listener) {
        this.listeners.add(listener); // Send current state to listener

        if (this.status === InterpreterStatus.Running) {
          listener(this.state, this.state.event);
        }

        return this;
      };

      Interpreter.prototype.subscribe = function (nextListenerOrObserver, _, // TODO: error listener
      completeListener) {
        var _this = this;

        if (!nextListenerOrObserver) {
          return {
            unsubscribe: function () {
              return void 0;
            }
          };
        }

        var listener;
        var resolvedCompleteListener = completeListener;

        if (typeof nextListenerOrObserver === 'function') {
          listener = nextListenerOrObserver;
        } else {
          listener = nextListenerOrObserver.next.bind(nextListenerOrObserver);
          resolvedCompleteListener = nextListenerOrObserver.complete.bind(nextListenerOrObserver);
        }

        this.listeners.add(listener); // Send current state to listener

        if (this.status === InterpreterStatus.Running) {
          listener(this.state);
        }

        if (resolvedCompleteListener) {
          this.onDone(resolvedCompleteListener);
        }

        return {
          unsubscribe: function () {
            listener && _this.listeners.delete(listener);
            resolvedCompleteListener && _this.doneListeners.delete(resolvedCompleteListener);
          }
        };
      };
      /**
       * Adds an event listener that is notified whenever an event is sent to the running interpreter.
       * @param listener The event listener
       */


      Interpreter.prototype.onEvent = function (listener) {
        this.eventListeners.add(listener);
        return this;
      };
      /**
       * Adds an event listener that is notified whenever a `send` event occurs.
       * @param listener The event listener
       */


      Interpreter.prototype.onSend = function (listener) {
        this.sendListeners.add(listener);
        return this;
      };
      /**
       * Adds a context listener that is notified whenever the state context changes.
       * @param listener The context listener
       */


      Interpreter.prototype.onChange = function (listener) {
        this.contextListeners.add(listener);
        return this;
      };
      /**
       * Adds a listener that is notified when the machine is stopped.
       * @param listener The listener
       */


      Interpreter.prototype.onStop = function (listener) {
        this.stopListeners.add(listener);
        return this;
      };
      /**
       * Adds a state listener that is notified when the statechart has reached its final state.
       * @param listener The state listener
       */


      Interpreter.prototype.onDone = function (listener) {
        this.doneListeners.add(listener);
        return this;
      };
      /**
       * Removes a listener.
       * @param listener The listener to remove
       */


      Interpreter.prototype.off = function (listener) {
        this.listeners.delete(listener);
        this.eventListeners.delete(listener);
        this.sendListeners.delete(listener);
        this.stopListeners.delete(listener);
        this.doneListeners.delete(listener);
        this.contextListeners.delete(listener);
        return this;
      };
      /**
       * Starts the interpreter from the given state, or the initial state.
       * @param initialState The state to start the statechart from
       */


      Interpreter.prototype.start = function (initialState) {
        var _this = this;

        if (this.status === InterpreterStatus.Running) {
          // Do not restart the service if it is already started
          return this;
        }

        registry.register(this.sessionId, this);
        this.initialized = true;
        this.status = InterpreterStatus.Running;
        var resolvedState = initialState === undefined ? this.initialState : provide(this, function () {
          return isState(initialState) ? _this.machine.resolveState(initialState) : _this.machine.resolveState(State.from(initialState, _this.machine.context));
        });

        if (this.options.devTools) {
          this.attachDev();
        }

        this.scheduler.initialize(function () {
          _this.update(resolvedState, initEvent);
        });
        return this;
      };
      /**
       * Stops the interpreter and unsubscribe all listeners.
       *
       * This will also notify the `onStop` listeners.
       */


      Interpreter.prototype.stop = function () {
        var e_6, _a, e_7, _b, e_8, _c, e_9, _d, e_10, _e;

        var _this = this;

        try {
          for (var _f = __values(this.listeners), _g = _f.next(); !_g.done; _g = _f.next()) {
            var listener = _g.value;
            this.listeners.delete(listener);
          }
        } catch (e_6_1) {
          e_6 = {
            error: e_6_1
          };
        } finally {
          try {
            if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
          } finally {
            if (e_6) throw e_6.error;
          }
        }

        try {
          for (var _h = __values(this.stopListeners), _j = _h.next(); !_j.done; _j = _h.next()) {
            var listener = _j.value; // call listener, then remove

            listener();
            this.stopListeners.delete(listener);
          }
        } catch (e_7_1) {
          e_7 = {
            error: e_7_1
          };
        } finally {
          try {
            if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
          } finally {
            if (e_7) throw e_7.error;
          }
        }

        try {
          for (var _k = __values(this.contextListeners), _l = _k.next(); !_l.done; _l = _k.next()) {
            var listener = _l.value;
            this.contextListeners.delete(listener);
          }
        } catch (e_8_1) {
          e_8 = {
            error: e_8_1
          };
        } finally {
          try {
            if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
          } finally {
            if (e_8) throw e_8.error;
          }
        }

        try {
          for (var _m = __values(this.doneListeners), _o = _m.next(); !_o.done; _o = _m.next()) {
            var listener = _o.value;
            this.doneListeners.delete(listener);
          }
        } catch (e_9_1) {
          e_9 = {
            error: e_9_1
          };
        } finally {
          try {
            if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
          } finally {
            if (e_9) throw e_9.error;
          }
        }

        if (!this.initialized) {
          // Interpreter already stopped; do nothing
          return this;
        }

        __spreadArray([], __read(this.state.configuration), false).sort(function (a, b) {
          return b.order - a.order;
        }).forEach(function (stateNode) {
          var e_11, _a;

          try {
            for (var _b = __values(stateNode.definition.exit), _c = _b.next(); !_c.done; _c = _b.next()) {
              var action = _c.value;

              _this.exec(action, _this.state);
            }
          } catch (e_11_1) {
            e_11 = {
              error: e_11_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_11) throw e_11.error;
            }
          }
        }); // Stop all children


        this.children.forEach(function (child) {
          if (isFunction(child.stop)) {
            child.stop();
          }
        });

        try {
          // Cancel all delayed events
          for (var _p = __values(keys(this.delayedEventsMap)), _q = _p.next(); !_q.done; _q = _p.next()) {
            var key = _q.value;
            this.clock.clearTimeout(this.delayedEventsMap[key]);
          }
        } catch (e_10_1) {
          e_10 = {
            error: e_10_1
          };
        } finally {
          try {
            if (_q && !_q.done && (_e = _p.return)) _e.call(_p);
          } finally {
            if (e_10) throw e_10.error;
          }
        }

        this.scheduler.clear();
        this.initialized = false;
        this.status = InterpreterStatus.Stopped;
        registry.free(this.sessionId);
        return this;
      };

      Interpreter.prototype.batch = function (events) {
        var _this = this;

        if (this.status === InterpreterStatus.NotStarted && this.options.deferEvents) {
          // tslint:disable-next-line:no-console
          {
            warn(false, "".concat(events.length, " event(s) were sent to uninitialized service \"").concat(this.machine.id, "\" and are deferred. Make sure .start() is called for this service.\nEvent: ").concat(JSON.stringify(event)));
          }
        } else if (this.status !== InterpreterStatus.Running) {
          throw new Error( // tslint:disable-next-line:max-line-length
          "".concat(events.length, " event(s) were sent to uninitialized service \"").concat(this.machine.id, "\". Make sure .start() is called for this service, or set { deferEvents: true } in the service options."));
        }

        this.scheduler.schedule(function () {
          var e_12, _a;

          var nextState = _this.state;
          var batchChanged = false;
          var batchedActions = [];

          var _loop_1 = function (event_1) {
            var _event = toSCXMLEvent(event_1);

            _this.forward(_event);

            nextState = provide(_this, function () {
              return _this.machine.transition(nextState, _event);
            });
            batchedActions.push.apply(batchedActions, __spreadArray([], __read(nextState.actions.map(function (a) {
              return bindActionToState(a, nextState);
            })), false));
            batchChanged = batchChanged || !!nextState.changed;
          };

          try {
            for (var events_1 = __values(events), events_1_1 = events_1.next(); !events_1_1.done; events_1_1 = events_1.next()) {
              var event_1 = events_1_1.value;

              _loop_1(event_1);
            }
          } catch (e_12_1) {
            e_12 = {
              error: e_12_1
            };
          } finally {
            try {
              if (events_1_1 && !events_1_1.done && (_a = events_1.return)) _a.call(events_1);
            } finally {
              if (e_12) throw e_12.error;
            }
          }

          nextState.changed = batchChanged;
          nextState.actions = batchedActions;

          _this.update(nextState, toSCXMLEvent(events[events.length - 1]));
        });
      };
      /**
       * Returns a send function bound to this interpreter instance.
       *
       * @param event The event to be sent by the sender.
       */


      Interpreter.prototype.sender = function (event) {
        return this.send.bind(this, event);
      };
      /**
       * Returns the next state given the interpreter's current state and the event.
       *
       * This is a pure method that does _not_ update the interpreter's state.
       *
       * @param event The event to determine the next state
       */


      Interpreter.prototype.nextState = function (event) {
        var _this = this;

        var _event = toSCXMLEvent(event);

        if (_event.name.indexOf(errorPlatform) === 0 && !this.state.nextEvents.some(function (nextEvent) {
          return nextEvent.indexOf(errorPlatform) === 0;
        })) {
          throw _event.data.data;
        }

        var nextState = provide(this, function () {
          return _this.machine.transition(_this.state, _event);
        });
        return nextState;
      };

      Interpreter.prototype.forward = function (event) {
        var e_13, _a;

        try {
          for (var _b = __values(this.forwardTo), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var child = this.children.get(id);

            if (!child) {
              throw new Error("Unable to forward event '".concat(event, "' from interpreter '").concat(this.id, "' to nonexistant child '").concat(id, "'."));
            }

            child.send(event);
          }
        } catch (e_13_1) {
          e_13 = {
            error: e_13_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_13) throw e_13.error;
          }
        }
      };

      Interpreter.prototype.defer = function (sendAction) {
        var _this = this;

        this.delayedEventsMap[sendAction.id] = this.clock.setTimeout(function () {
          if (sendAction.to) {
            _this.sendTo(sendAction._event, sendAction.to);
          } else {
            _this.send(sendAction._event);
          }
        }, sendAction.delay);
      };

      Interpreter.prototype.cancel = function (sendId) {
        this.clock.clearTimeout(this.delayedEventsMap[sendId]);
        delete this.delayedEventsMap[sendId];
      };

      Interpreter.prototype.exec = function (action, state, actionFunctionMap) {
        if (actionFunctionMap === void 0) {
          actionFunctionMap = this.machine.options.actions;
        }

        var context = state.context,
            _event = state._event;
        var actionOrExec = action.exec || getActionFunction(action.type, actionFunctionMap);
        var exec = isFunction(actionOrExec) ? actionOrExec : actionOrExec ? actionOrExec.exec : action.exec;

        if (exec) {
          try {
            return exec(context, _event.data, {
              action: action,
              state: this.state,
              _event: _event
            });
          } catch (err) {
            if (this.parent) {
              this.parent.send({
                type: 'xstate.error',
                data: err
              });
            }

            throw err;
          }
        }

        switch (action.type) {
          case send$1:
            var sendAction = action;

            if (typeof sendAction.delay === 'number') {
              this.defer(sendAction);
              return;
            } else {
              if (sendAction.to) {
                this.sendTo(sendAction._event, sendAction.to);
              } else {
                this.send(sendAction._event);
              }
            }

            break;

          case cancel$1:
            this.cancel(action.sendId);
            break;

          case start$1:
            {
              if (this.status !== InterpreterStatus.Running) {
                return;
              }

              var activity = action.activity; // If the activity will be stopped right after it's started
              // (such as in transient states)
              // don't bother starting the activity.

              if (!this.state.activities[activity.id || activity.type]) {
                break;
              } // Invoked services


              if (activity.type === ActionTypes.Invoke) {
                var invokeSource = toInvokeSource$1(activity.src);
                var serviceCreator = this.machine.options.services ? this.machine.options.services[invokeSource.type] : undefined;
                var id = activity.id,
                    data = activity.data;

                {
                  warn(!('forward' in activity), // tslint:disable-next-line:max-line-length
                  "`forward` property is deprecated (found in invocation of '".concat(activity.src, "' in in machine '").concat(this.machine.id, "'). ") + "Please use `autoForward` instead.");
                }

                var autoForward = 'autoForward' in activity ? activity.autoForward : !!activity.forward;

                if (!serviceCreator) {
                  // tslint:disable-next-line:no-console
                  {
                    warn(false, "No service found for invocation '".concat(activity.src, "' in machine '").concat(this.machine.id, "'."));
                  }

                  return;
                }

                var resolvedData = data ? mapContext(data, context, _event) : undefined;

                if (typeof serviceCreator === 'string') {
                  // TODO: warn
                  return;
                }

                var source = isFunction(serviceCreator) ? serviceCreator(context, _event.data, {
                  data: resolvedData,
                  src: invokeSource,
                  meta: activity.meta
                }) : serviceCreator;

                if (!source) {
                  // TODO: warn?
                  return;
                }

                var options = void 0;

                if (isMachine(source)) {
                  source = resolvedData ? source.withContext(resolvedData) : source;
                  options = {
                    autoForward: autoForward
                  };
                }

                this.spawn(source, id, options);
              } else {
                this.spawnActivity(activity);
              }

              break;
            }

          case stop$2:
            {
              this.stopChild(action.activity.id);
              break;
            }

          case log:
            var label = action.label,
                value = action.value;

            if (label) {
              this.logger(label, value);
            } else {
              this.logger(value);
            }

            break;

          default:
            {
              warn(false, "No implementation found for action type '".concat(action.type, "'"));
            }

            break;
        }

        return undefined;
      };

      Interpreter.prototype.removeChild = function (childId) {
        var _a;

        this.children.delete(childId);
        this.forwardTo.delete(childId); // this.state might not exist at the time this is called,
        // such as when a child is added then removed while initializing the state

        (_a = this.state) === null || _a === void 0 ? true : delete _a.children[childId];
      };

      Interpreter.prototype.stopChild = function (childId) {
        var child = this.children.get(childId);

        if (!child) {
          return;
        }

        this.removeChild(childId);

        if (isFunction(child.stop)) {
          child.stop();
        }
      };

      Interpreter.prototype.spawn = function (entity, name, options) {
        if (isPromiseLike(entity)) {
          return this.spawnPromise(Promise.resolve(entity), name);
        } else if (isFunction(entity)) {
          return this.spawnCallback(entity, name);
        } else if (isSpawnedActor(entity)) {
          return this.spawnActor(entity, name);
        } else if (isObservable(entity)) {
          return this.spawnObservable(entity, name);
        } else if (isMachine(entity)) {
          return this.spawnMachine(entity, __assign(__assign({}, options), {
            id: name
          }));
        } else if (isBehavior(entity)) {
          return this.spawnBehavior(entity, name);
        } else {
          throw new Error("Unable to spawn entity \"".concat(name, "\" of type \"").concat(typeof entity, "\"."));
        }
      };

      Interpreter.prototype.spawnMachine = function (machine, options) {
        var _this = this;

        if (options === void 0) {
          options = {};
        }

        var childService = new Interpreter(machine, __assign(__assign({}, this.options), {
          parent: this,
          id: options.id || machine.id
        }));

        var resolvedOptions = __assign(__assign({}, DEFAULT_SPAWN_OPTIONS), options);

        if (resolvedOptions.sync) {
          childService.onTransition(function (state) {
            _this.send(update, {
              state: state,
              id: childService.id
            });
          });
        }

        var actor = childService;
        this.children.set(childService.id, actor);

        if (resolvedOptions.autoForward) {
          this.forwardTo.add(childService.id);
        }

        childService.onDone(function (doneEvent) {
          _this.removeChild(childService.id);

          _this.send(toSCXMLEvent(doneEvent, {
            origin: childService.id
          }));
        }).start();
        return actor;
      };

      Interpreter.prototype.spawnBehavior = function (behavior, id) {
        var actorRef = spawnBehavior(behavior, {
          id: id,
          parent: this
        });
        this.children.set(id, actorRef);
        return actorRef;
      };

      Interpreter.prototype.spawnPromise = function (promise, id) {
        var _this = this;

        var canceled = false;
        var resolvedData;
        promise.then(function (response) {
          if (!canceled) {
            resolvedData = response;

            _this.removeChild(id);

            _this.send(toSCXMLEvent(doneInvoke(id, response), {
              origin: id
            }));
          }
        }, function (errorData) {
          if (!canceled) {
            _this.removeChild(id);

            var errorEvent = error(id, errorData);

            try {
              // Send "error.platform.id" to this (parent).
              _this.send(toSCXMLEvent(errorEvent, {
                origin: id
              }));
            } catch (error) {
              reportUnhandledExceptionOnInvocation(errorData, error, id);

              if (_this.devTools) {
                _this.devTools.send(errorEvent, _this.state);
              }

              if (_this.machine.strict) {
                // it would be better to always stop the state machine if unhandled
                // exception/promise rejection happens but because we don't want to
                // break existing code so enforce it on strict mode only especially so
                // because documentation says that onError is optional
                _this.stop();
              }
            }
          }
        });

        var actor = __assign({
          id: id,
          send: function () {
            return void 0;
          },
          subscribe: function (next, handleError, complete) {
            var observer = toObserver(next, handleError, complete);
            var unsubscribed = false;
            promise.then(function (response) {
              if (unsubscribed) {
                return;
              }

              observer.next(response);

              if (unsubscribed) {
                return;
              }

              observer.complete();
            }, function (err) {
              if (unsubscribed) {
                return;
              }

              observer.error(err);
            });
            return {
              unsubscribe: function () {
                return unsubscribed = true;
              }
            };
          },
          stop: function () {
            canceled = true;
          },
          toJSON: function () {
            return {
              id: id
            };
          },
          getSnapshot: function () {
            return resolvedData;
          }
        }, interopSymbols);

        this.children.set(id, actor);
        return actor;
      };

      Interpreter.prototype.spawnCallback = function (callback, id) {
        var _this = this;

        var canceled = false;
        var receivers = new Set();
        var listeners = new Set();
        var emitted;

        var receive = function (e) {
          emitted = e;
          listeners.forEach(function (listener) {
            return listener(e);
          });

          if (canceled) {
            return;
          }

          _this.send(toSCXMLEvent(e, {
            origin: id
          }));
        };

        var callbackStop;

        try {
          callbackStop = callback(receive, function (newListener) {
            receivers.add(newListener);
          });
        } catch (err) {
          this.send(error(id, err));
        }

        if (isPromiseLike(callbackStop)) {
          // it turned out to be an async function, can't reliably check this before calling `callback`
          // because transpiled async functions are not recognizable
          return this.spawnPromise(callbackStop, id);
        }

        var actor = __assign({
          id: id,
          send: function (event) {
            return receivers.forEach(function (receiver) {
              return receiver(event);
            });
          },
          subscribe: function (next) {
            listeners.add(next);
            return {
              unsubscribe: function () {
                listeners.delete(next);
              }
            };
          },
          stop: function () {
            canceled = true;

            if (isFunction(callbackStop)) {
              callbackStop();
            }
          },
          toJSON: function () {
            return {
              id: id
            };
          },
          getSnapshot: function () {
            return emitted;
          }
        }, interopSymbols);

        this.children.set(id, actor);
        return actor;
      };

      Interpreter.prototype.spawnObservable = function (source, id) {
        var _this = this;

        var emitted;
        var subscription = source.subscribe(function (value) {
          emitted = value;

          _this.send(toSCXMLEvent(value, {
            origin: id
          }));
        }, function (err) {
          _this.removeChild(id);

          _this.send(toSCXMLEvent(error(id, err), {
            origin: id
          }));
        }, function () {
          _this.removeChild(id);

          _this.send(toSCXMLEvent(doneInvoke(id), {
            origin: id
          }));
        });

        var actor = __assign({
          id: id,
          send: function () {
            return void 0;
          },
          subscribe: function (next, handleError, complete) {
            return source.subscribe(next, handleError, complete);
          },
          stop: function () {
            return subscription.unsubscribe();
          },
          getSnapshot: function () {
            return emitted;
          },
          toJSON: function () {
            return {
              id: id
            };
          }
        }, interopSymbols);

        this.children.set(id, actor);
        return actor;
      };

      Interpreter.prototype.spawnActor = function (actor, name) {
        this.children.set(name, actor);
        return actor;
      };

      Interpreter.prototype.spawnActivity = function (activity) {
        var implementation = this.machine.options && this.machine.options.activities ? this.machine.options.activities[activity.type] : undefined;

        if (!implementation) {
          {
            warn(false, "No implementation found for activity '".concat(activity.type, "'"));
          } // tslint:disable-next-line:no-console


          return;
        } // Start implementation


        var dispose = implementation(this.state.context, activity);
        this.spawnEffect(activity.id, dispose);
      };

      Interpreter.prototype.spawnEffect = function (id, dispose) {
        this.children.set(id, __assign({
          id: id,
          send: function () {
            return void 0;
          },
          subscribe: function () {
            return {
              unsubscribe: function () {
                return void 0;
              }
            };
          },
          stop: dispose || undefined,
          getSnapshot: function () {
            return undefined;
          },
          toJSON: function () {
            return {
              id: id
            };
          }
        }, interopSymbols));
      };

      Interpreter.prototype.attachDev = function () {
        var global = getGlobal();

        if (this.options.devTools && global) {
          if (global.__REDUX_DEVTOOLS_EXTENSION__) {
            var devToolsOptions = typeof this.options.devTools === 'object' ? this.options.devTools : undefined;
            this.devTools = global.__REDUX_DEVTOOLS_EXTENSION__.connect(__assign(__assign({
              name: this.id,
              autoPause: true,
              stateSanitizer: function (state) {
                return {
                  value: state.value,
                  context: state.context,
                  actions: state.actions
                };
              }
            }, devToolsOptions), {
              features: __assign({
                jump: false,
                skip: false
              }, devToolsOptions ? devToolsOptions.features : undefined)
            }), this.machine);
            this.devTools.init(this.state);
          } // add XState-specific dev tooling hook


          registerService(this);
        }
      };

      Interpreter.prototype.toJSON = function () {
        return {
          id: this.id
        };
      };

      Interpreter.prototype[symbolObservable] = function () {
        return this;
      }; // this gets stripped by Babel to avoid having "undefined" property in environments without this non-standard Symbol
      // it has to be here to be included in the generated .d.ts


      Interpreter.prototype.getSnapshot = function () {
        if (this.status === InterpreterStatus.NotStarted) {
          return this.initialState;
        }

        return this._state;
      };
      /**
       * The default interpreter options:
       *
       * - `clock` uses the global `setTimeout` and `clearTimeout` functions
       * - `logger` uses the global `console.log()` method
       */


      Interpreter.defaultOptions = /*#__PURE__*/function (global) {
        return {
          execute: true,
          deferEvents: true,
          clock: {
            setTimeout: function (fn, ms) {
              return setTimeout(fn, ms);
            },
            clearTimeout: function (id) {
              return clearTimeout(id);
            }
          },
          logger: global.console.log.bind(console),
          devTools: false
        };
      }(typeof self !== 'undefined' ? self : global);

      Interpreter.interpret = interpret;
      return Interpreter;
    }();
    /**
     * Creates a new Interpreter instance for the given machine with the provided options, if any.
     *
     * @param machine The machine to interpret
     * @param options Interpreter options
     */

    function interpret(machine, options) {
      var interpreter = new Interpreter(machine, options);
      return interpreter;
    }

    // eslint-lint-disable-next-line @typescript-eslint/naming-convention
    class HTTPError extends Error {
        constructor(response, request, options) {
            const code = (response.status || response.status === 0) ? response.status : '';
            const title = response.statusText || '';
            const status = `${code} ${title}`.trim();
            const reason = status ? `status code ${status}` : 'an unknown error';
            super(`Request failed with ${reason}`);
            this.name = 'HTTPError';
            this.response = response;
            this.request = request;
            this.options = options;
        }
    }

    class TimeoutError extends Error {
        constructor(request) {
            super('Request timed out');
            this.name = 'TimeoutError';
            this.request = request;
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const isObject = (value) => value !== null && typeof value === 'object';

    const validateAndMerge = (...sources) => {
        for (const source of sources) {
            if ((!isObject(source) || Array.isArray(source)) && typeof source !== 'undefined') {
                throw new TypeError('The `options` argument must be an object');
            }
        }
        return deepMerge({}, ...sources);
    };
    const mergeHeaders = (source1 = {}, source2 = {}) => {
        const result = new globalThis.Headers(source1);
        const isHeadersInstance = source2 instanceof globalThis.Headers;
        const source = new globalThis.Headers(source2);
        for (const [key, value] of source.entries()) {
            if ((isHeadersInstance && value === 'undefined') || value === undefined) {
                result.delete(key);
            }
            else {
                result.set(key, value);
            }
        }
        return result;
    };
    // TODO: Make this strongly-typed (no `any`).
    const deepMerge = (...sources) => {
        let returnValue = {};
        let headers = {};
        for (const source of sources) {
            if (Array.isArray(source)) {
                if (!Array.isArray(returnValue)) {
                    returnValue = [];
                }
                returnValue = [...returnValue, ...source];
            }
            else if (isObject(source)) {
                for (let [key, value] of Object.entries(source)) {
                    if (isObject(value) && key in returnValue) {
                        value = deepMerge(returnValue[key], value);
                    }
                    returnValue = { ...returnValue, [key]: value };
                }
                if (isObject(source.headers)) {
                    headers = mergeHeaders(headers, source.headers);
                    returnValue.headers = headers;
                }
            }
        }
        return returnValue;
    };

    const supportsAbortController = typeof globalThis.AbortController === 'function';
    const supportsStreams = typeof globalThis.ReadableStream === 'function';
    const supportsFormData = typeof globalThis.FormData === 'function';
    const requestMethods = ['get', 'post', 'put', 'patch', 'head', 'delete'];
    const responseTypes = {
        json: 'application/json',
        text: 'text/*',
        formData: 'multipart/form-data',
        arrayBuffer: '*/*',
        blob: '*/*',
    };
    // The maximum value of a 32bit int (see issue #117)
    const maxSafeTimeout = 2147483647;
    const stop = Symbol('stop');

    const normalizeRequestMethod = (input) => requestMethods.includes(input) ? input.toUpperCase() : input;
    const retryMethods = ['get', 'put', 'head', 'delete', 'options', 'trace'];
    const retryStatusCodes = [408, 413, 429, 500, 502, 503, 504];
    const retryAfterStatusCodes = [413, 429, 503];
    const defaultRetryOptions = {
        limit: 2,
        methods: retryMethods,
        statusCodes: retryStatusCodes,
        afterStatusCodes: retryAfterStatusCodes,
        maxRetryAfter: Number.POSITIVE_INFINITY,
    };
    const normalizeRetryOptions = (retry = {}) => {
        if (typeof retry === 'number') {
            return {
                ...defaultRetryOptions,
                limit: retry,
            };
        }
        if (retry.methods && !Array.isArray(retry.methods)) {
            throw new Error('retry.methods must be an array');
        }
        if (retry.statusCodes && !Array.isArray(retry.statusCodes)) {
            throw new Error('retry.statusCodes must be an array');
        }
        return {
            ...defaultRetryOptions,
            ...retry,
            afterStatusCodes: retryAfterStatusCodes,
        };
    };

    // `Promise.race()` workaround (#91)
    const timeout = async (request, abortController, options) => new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            if (abortController) {
                abortController.abort();
            }
            reject(new TimeoutError(request));
        }, options.timeout);
        /* eslint-disable promise/prefer-await-to-then */
        void options
            .fetch(request)
            .then(resolve)
            .catch(reject)
            .then(() => {
            clearTimeout(timeoutId);
        });
        /* eslint-enable promise/prefer-await-to-then */
    });
    const delay = async (ms) => new Promise(resolve => {
        setTimeout(resolve, ms);
    });

    class Ky {
        // eslint-disable-next-line complexity
        constructor(input, options = {}) {
            var _a, _b;
            this._retryCount = 0;
            this._input = input;
            this._options = {
                // TODO: credentials can be removed when the spec change is implemented in all browsers. Context: https://www.chromestatus.com/feature/4539473312350208
                credentials: this._input.credentials || 'same-origin',
                ...options,
                headers: mergeHeaders(this._input.headers, options.headers),
                hooks: deepMerge({
                    beforeRequest: [],
                    beforeRetry: [],
                    afterResponse: [],
                }, options.hooks),
                method: normalizeRequestMethod((_a = options.method) !== null && _a !== void 0 ? _a : this._input.method),
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                prefixUrl: String(options.prefixUrl || ''),
                retry: normalizeRetryOptions(options.retry),
                throwHttpErrors: options.throwHttpErrors !== false,
                timeout: typeof options.timeout === 'undefined' ? 10000 : options.timeout,
                fetch: (_b = options.fetch) !== null && _b !== void 0 ? _b : globalThis.fetch.bind(globalThis),
            };
            if (typeof this._input !== 'string' && !(this._input instanceof URL || this._input instanceof globalThis.Request)) {
                throw new TypeError('`input` must be a string, URL, or Request');
            }
            if (this._options.prefixUrl && typeof this._input === 'string') {
                if (this._input.startsWith('/')) {
                    throw new Error('`input` must not begin with a slash when using `prefixUrl`');
                }
                if (!this._options.prefixUrl.endsWith('/')) {
                    this._options.prefixUrl += '/';
                }
                this._input = this._options.prefixUrl + this._input;
            }
            if (supportsAbortController) {
                this.abortController = new globalThis.AbortController();
                if (this._options.signal) {
                    this._options.signal.addEventListener('abort', () => {
                        this.abortController.abort();
                    });
                }
                this._options.signal = this.abortController.signal;
            }
            this.request = new globalThis.Request(this._input, this._options);
            if (this._options.searchParams) {
                // eslint-disable-next-line unicorn/prevent-abbreviations
                const textSearchParams = typeof this._options.searchParams === 'string'
                    ? this._options.searchParams.replace(/^\?/, '')
                    : new URLSearchParams(this._options.searchParams).toString();
                // eslint-disable-next-line unicorn/prevent-abbreviations
                const searchParams = '?' + textSearchParams;
                const url = this.request.url.replace(/(?:\?.*?)?(?=#|$)/, searchParams);
                // To provide correct form boundary, Content-Type header should be deleted each time when new Request instantiated from another one
                if (((supportsFormData && this._options.body instanceof globalThis.FormData)
                    || this._options.body instanceof URLSearchParams) && !(this._options.headers && this._options.headers['content-type'])) {
                    this.request.headers.delete('content-type');
                }
                this.request = new globalThis.Request(new globalThis.Request(url, this.request), this._options);
            }
            if (this._options.json !== undefined) {
                this._options.body = JSON.stringify(this._options.json);
                this.request.headers.set('content-type', 'application/json');
                this.request = new globalThis.Request(this.request, { body: this._options.body });
            }
        }
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        static create(input, options) {
            const ky = new Ky(input, options);
            const fn = async () => {
                if (ky._options.timeout > maxSafeTimeout) {
                    throw new RangeError(`The \`timeout\` option cannot be greater than ${maxSafeTimeout}`);
                }
                // Delay the fetch so that body method shortcuts can set the Accept header
                await Promise.resolve();
                let response = await ky._fetch();
                for (const hook of ky._options.hooks.afterResponse) {
                    // eslint-disable-next-line no-await-in-loop
                    const modifiedResponse = await hook(ky.request, ky._options, ky._decorateResponse(response.clone()));
                    if (modifiedResponse instanceof globalThis.Response) {
                        response = modifiedResponse;
                    }
                }
                ky._decorateResponse(response);
                if (!response.ok && ky._options.throwHttpErrors) {
                    throw new HTTPError(response, ky.request, ky._options);
                }
                // If `onDownloadProgress` is passed, it uses the stream API internally
                /* istanbul ignore next */
                if (ky._options.onDownloadProgress) {
                    if (typeof ky._options.onDownloadProgress !== 'function') {
                        throw new TypeError('The `onDownloadProgress` option must be a function');
                    }
                    if (!supportsStreams) {
                        throw new Error('Streams are not supported in your environment. `ReadableStream` is missing.');
                    }
                    return ky._stream(response.clone(), ky._options.onDownloadProgress);
                }
                return response;
            };
            const isRetriableMethod = ky._options.retry.methods.includes(ky.request.method.toLowerCase());
            const result = (isRetriableMethod ? ky._retry(fn) : fn());
            for (const [type, mimeType] of Object.entries(responseTypes)) {
                result[type] = async () => {
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    ky.request.headers.set('accept', ky.request.headers.get('accept') || mimeType);
                    const response = (await result).clone();
                    if (type === 'json') {
                        if (response.status === 204) {
                            return '';
                        }
                        if (options.parseJson) {
                            return options.parseJson(await response.text());
                        }
                    }
                    return response[type]();
                };
            }
            return result;
        }
        _calculateRetryDelay(error) {
            this._retryCount++;
            if (this._retryCount < this._options.retry.limit && !(error instanceof TimeoutError)) {
                if (error instanceof HTTPError) {
                    if (!this._options.retry.statusCodes.includes(error.response.status)) {
                        return 0;
                    }
                    const retryAfter = error.response.headers.get('Retry-After');
                    if (retryAfter && this._options.retry.afterStatusCodes.includes(error.response.status)) {
                        let after = Number(retryAfter);
                        if (Number.isNaN(after)) {
                            after = Date.parse(retryAfter) - Date.now();
                        }
                        else {
                            after *= 1000;
                        }
                        if (typeof this._options.retry.maxRetryAfter !== 'undefined' && after > this._options.retry.maxRetryAfter) {
                            return 0;
                        }
                        return after;
                    }
                    if (error.response.status === 413) {
                        return 0;
                    }
                }
                const BACKOFF_FACTOR = 0.3;
                return BACKOFF_FACTOR * (2 ** (this._retryCount - 1)) * 1000;
            }
            return 0;
        }
        _decorateResponse(response) {
            if (this._options.parseJson) {
                response.json = async () => this._options.parseJson(await response.text());
            }
            return response;
        }
        async _retry(fn) {
            try {
                return await fn();
                // eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
            }
            catch (error) {
                const ms = Math.min(this._calculateRetryDelay(error), maxSafeTimeout);
                if (ms !== 0 && this._retryCount > 0) {
                    await delay(ms);
                    for (const hook of this._options.hooks.beforeRetry) {
                        // eslint-disable-next-line no-await-in-loop
                        const hookResult = await hook({
                            request: this.request,
                            options: this._options,
                            error: error,
                            retryCount: this._retryCount,
                        });
                        // If `stop` is returned from the hook, the retry process is stopped
                        if (hookResult === stop) {
                            return;
                        }
                    }
                    return this._retry(fn);
                }
                throw error;
            }
        }
        async _fetch() {
            for (const hook of this._options.hooks.beforeRequest) {
                // eslint-disable-next-line no-await-in-loop
                const result = await hook(this.request, this._options);
                if (result instanceof Request) {
                    this.request = result;
                    break;
                }
                if (result instanceof Response) {
                    return result;
                }
            }
            if (this._options.timeout === false) {
                return this._options.fetch(this.request.clone());
            }
            return timeout(this.request.clone(), this.abortController, this._options);
        }
        /* istanbul ignore next */
        _stream(response, onDownloadProgress) {
            const totalBytes = Number(response.headers.get('content-length')) || 0;
            let transferredBytes = 0;
            return new globalThis.Response(new globalThis.ReadableStream({
                async start(controller) {
                    const reader = response.body.getReader();
                    if (onDownloadProgress) {
                        onDownloadProgress({ percent: 0, transferredBytes: 0, totalBytes }, new Uint8Array());
                    }
                    async function read() {
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.close();
                            return;
                        }
                        if (onDownloadProgress) {
                            transferredBytes += value.byteLength;
                            const percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
                            onDownloadProgress({ percent, transferredBytes, totalBytes }, value);
                        }
                        controller.enqueue(value);
                        await read();
                    }
                    await read();
                },
            }));
        }
    }

    /*! MIT License © Sindre Sorhus */
    const createInstance = (defaults) => {
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        const ky = (input, options) => Ky.create(input, validateAndMerge(defaults, options));
        for (const method of requestMethods) {
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            ky[method] = (input, options) => Ky.create(input, validateAndMerge(defaults, options, { method }));
        }
        ky.create = (newDefaults) => createInstance(validateAndMerge(newDefaults));
        ky.extend = (newDefaults) => createInstance(validateAndMerge(defaults, newDefaults));
        ky.stop = stop;
        return ky;
    };
    const ky = createInstance();
    var ky$1 = ky;

    const prefixUrl =
        {"NODE_ENV":"development","API_URL":"https://strapi.hand.group","API_URL_DEV":"http://localhost:1337"}.API_URL_DEV;

    let options = {
        prefixUrl: prefixUrl,
        credentials: "include",
        headers: {},
        hooks: {},
    };

    const http = ky$1.extend(options);

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/EventInquiry.svelte generated by Svelte v3.46.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/EventInquiry.svelte";

    // (304:0) {:else}
    function create_else_block(ctx) {
    	let main;
    	let div;
    	let h1;
    	let t1;
    	let span;
    	let t3;
    	let show_if_4 = /*collapse*/ ctx[4]("type");
    	let t4;
    	let show_if_3 = /*collapse*/ ctx[4]("amount_guests");
    	let t5;
    	let show_if_2 = /*collapse*/ ctx[4]("date");
    	let t6;
    	let show_if_1 = /*collapse*/ ctx[4]("locations");
    	let t7;
    	let show_if = /*collapse*/ ctx[4]("contact");
    	let current;
    	let if_block0 = show_if_4 && create_if_block_8(ctx);
    	let if_block1 = show_if_3 && create_if_block_7(ctx);
    	let if_block2 = show_if_2 && create_if_block_6(ctx);
    	let if_block3 = show_if_1 && create_if_block_5(ctx);
    	let if_block4 = show_if && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Sie möchten mit uns Feiern?";
    			t1 = space();
    			span = element("span");
    			span.textContent = "Geben Sie uns Ihre Wünsche und wichtigsten Anforderungen mit und\n                wir werden schnellstmöglich ein Konzept für Ihre Veranstaltung\n                erstellen.";
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			t7 = space();
    			if (if_block4) if_block4.c();
    			add_location(h1, file$1, 306, 12, 9750);
    			set_style(span, "line-height", "1.5em");
    			add_location(span, file$1, 307, 12, 9799);
    			attr_dev(div, "class", "header");
    			add_location(div, file$1, 305, 8, 9717);
    			add_location(main, file$1, 304, 4, 9702);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, span);
    			append_dev(main, t3);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t4);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t5);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t6);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t7);
    			if (if_block4) if_block4.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collapse*/ 16) show_if_4 = /*collapse*/ ctx[4]("type");

    			if (show_if_4) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_8(ctx);
    					if_block0.c();
    					if_block0.m(main, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*collapse*/ 16) show_if_3 = /*collapse*/ ctx[4]("amount_guests");

    			if (show_if_3) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*collapse*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t5);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*collapse*/ 16) show_if_2 = /*collapse*/ ctx[4]("date");

    			if (show_if_2) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*collapse*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_6(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t6);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*collapse*/ 16) show_if_1 = /*collapse*/ ctx[4]("locations");

    			if (show_if_1) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*collapse*/ 16) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_5(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t7);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*collapse*/ 16) show_if = /*collapse*/ ctx[4]("contact");

    			if (show_if) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty & /*collapse*/ 16) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(main, null);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(304:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (213:0) {#if formState.matches("finished")}
    function create_if_block$1(ctx) {
    	let main;
    	let div27;
    	let div0;
    	let span0;
    	let t1;
    	let h1;
    	let t3;
    	let span1;
    	let t5;
    	let div25;
    	let h4;
    	let t7;
    	let div3;
    	let div1;
    	let b0;
    	let t9;
    	let div2;
    	let t10_value = /*inquiry*/ ctx[3].id + "";
    	let t10;
    	let t11;
    	let div6;
    	let div4;
    	let b1;
    	let t13;
    	let div5;
    	let t14_value = /*inquiry*/ ctx[3].name + "";
    	let t14;
    	let t15;
    	let t16;
    	let div9;
    	let div7;
    	let b2;
    	let t18;
    	let div8;
    	let t19_value = /*inquiry*/ ctx[3].email + "";
    	let t19;
    	let t20;
    	let div12;
    	let div10;
    	let b3;
    	let t22;
    	let div11;
    	let t23_value = /*inquiry*/ ctx[3].phone + "";
    	let t23;
    	let t24;
    	let br;
    	let t25;
    	let div15;
    	let div13;
    	let b4;
    	let t27;
    	let div14;

    	let t28_value = new Date(/*inquiry*/ ctx[3].date).toLocaleDateString("de-DE", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric"
    	}) + "";

    	let t28;
    	let t29;
    	let div18;
    	let div16;
    	let b5;
    	let t31;
    	let div17;
    	let t32_value = /*inquiry*/ ctx[3].type + "";
    	let t32;
    	let t33;
    	let div21;
    	let div19;
    	let b6;
    	let t35;
    	let div20;
    	let t36_value = /*inquiry*/ ctx[3].locations.map(func).join(", ") + "";
    	let t36;
    	let t37;
    	let div24;
    	let div22;
    	let b7;
    	let t39;
    	let div23;
    	let t40_value = /*inquiry*/ ctx[3].amount_guests + "";
    	let t40;
    	let t41;
    	let t42;
    	let t43;
    	let div26;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block0 = /*inquiry*/ ctx[3].company && create_if_block_2(ctx);
    	let if_block1 = /*inquiry*/ ctx[3].text && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div27 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "🥳 🎉";
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "Danke für Ihre Eventanfrage!";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Wir werden uns schnellstmöglich bei Ihnen melden.";
    			t5 = space();
    			div25 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Ihre Anfrage im Überblick";
    			t7 = space();
    			div3 = element("div");
    			div1 = element("div");
    			b0 = element("b");
    			b0.textContent = "Anfrage-ID:";
    			t9 = space();
    			div2 = element("div");
    			t10 = text(t10_value);
    			t11 = space();
    			div6 = element("div");
    			div4 = element("div");
    			b1 = element("b");
    			b1.textContent = "Name:";
    			t13 = space();
    			div5 = element("div");
    			t14 = text(t14_value);
    			t15 = space();
    			if (if_block0) if_block0.c();
    			t16 = space();
    			div9 = element("div");
    			div7 = element("div");
    			b2 = element("b");
    			b2.textContent = "Email:";
    			t18 = space();
    			div8 = element("div");
    			t19 = text(t19_value);
    			t20 = space();
    			div12 = element("div");
    			div10 = element("div");
    			b3 = element("b");
    			b3.textContent = "Telefon:";
    			t22 = space();
    			div11 = element("div");
    			t23 = text(t23_value);
    			t24 = space();
    			br = element("br");
    			t25 = space();
    			div15 = element("div");
    			div13 = element("div");
    			b4 = element("b");
    			b4.textContent = "Datum:";
    			t27 = space();
    			div14 = element("div");
    			t28 = text(t28_value);
    			t29 = space();
    			div18 = element("div");
    			div16 = element("div");
    			b5 = element("b");
    			b5.textContent = "Eventtyp:";
    			t31 = space();
    			div17 = element("div");
    			t32 = text(t32_value);
    			t33 = space();
    			div21 = element("div");
    			div19 = element("div");
    			b6 = element("b");
    			b6.textContent = "Locations:";
    			t35 = space();
    			div20 = element("div");
    			t36 = text(t36_value);
    			t37 = space();
    			div24 = element("div");
    			div22 = element("div");
    			b7 = element("b");
    			b7.textContent = "Gäste:";
    			t39 = space();
    			div23 = element("div");
    			t40 = text(t40_value);
    			t41 = text(" Personen");
    			t42 = space();
    			if (if_block1) if_block1.c();
    			t43 = space();
    			div26 = element("div");
    			button = element("button");
    			button.textContent = "Neue Anfrage stellen";
    			set_style(span0, "font-size", "5em");
    			add_location(span0, file$1, 216, 16, 5980);
    			add_location(h1, file$1, 217, 16, 6038);
    			add_location(span1, file$1, 218, 16, 6092);
    			attr_dev(div0, "class", "header");
    			add_location(div0, file$1, 215, 12, 5943);
    			set_style(h4, "font-weight", "bold");
    			set_style(h4, "margin-bottom", "24px");
    			add_location(h4, file$1, 221, 16, 6225);
    			add_location(b0, file$1, 225, 39, 6424);
    			attr_dev(div1, "class", "label");
    			add_location(div1, file$1, 225, 20, 6405);
    			attr_dev(div2, "class", "value");
    			add_location(div2, file$1, 226, 20, 6469);
    			attr_dev(div3, "class", "attribute");
    			add_location(div3, file$1, 224, 16, 6361);
    			add_location(b1, file$1, 229, 39, 6609);
    			attr_dev(div4, "class", "label");
    			add_location(div4, file$1, 229, 20, 6590);
    			attr_dev(div5, "class", "value");
    			add_location(div5, file$1, 230, 20, 6648);
    			attr_dev(div6, "class", "attribute");
    			add_location(div6, file$1, 228, 16, 6546);
    			add_location(b2, file$1, 239, 39, 7051);
    			attr_dev(div7, "class", "label");
    			add_location(div7, file$1, 239, 20, 7032);
    			attr_dev(div8, "class", "value");
    			add_location(div8, file$1, 240, 20, 7091);
    			attr_dev(div9, "class", "attribute");
    			add_location(div9, file$1, 238, 16, 6988);
    			add_location(b3, file$1, 243, 39, 7234);
    			attr_dev(div10, "class", "label");
    			add_location(div10, file$1, 243, 20, 7215);
    			attr_dev(div11, "class", "value");
    			add_location(div11, file$1, 244, 20, 7276);
    			attr_dev(div12, "class", "attribute");
    			add_location(div12, file$1, 242, 16, 7171);
    			add_location(br, file$1, 246, 16, 7356);
    			add_location(b4, file$1, 248, 39, 7442);
    			attr_dev(div13, "class", "label");
    			add_location(div13, file$1, 248, 20, 7423);
    			attr_dev(div14, "class", "value");
    			add_location(div14, file$1, 249, 20, 7482);
    			attr_dev(div15, "class", "attribute");
    			add_location(div15, file$1, 247, 16, 7379);
    			add_location(b5, file$1, 259, 39, 7914);
    			attr_dev(div16, "class", "label");
    			add_location(div16, file$1, 259, 20, 7895);
    			attr_dev(div17, "class", "value");
    			add_location(div17, file$1, 260, 20, 7957);
    			attr_dev(div18, "class", "attribute");
    			add_location(div18, file$1, 258, 16, 7851);
    			add_location(b6, file$1, 263, 39, 8099);
    			attr_dev(div19, "class", "label");
    			add_location(div19, file$1, 263, 20, 8080);
    			attr_dev(div20, "class", "value");
    			add_location(div20, file$1, 264, 20, 8143);
    			attr_dev(div21, "class", "attribute");
    			add_location(div21, file$1, 262, 16, 8036);
    			add_location(b7, file$1, 271, 39, 8438);
    			attr_dev(div22, "class", "label");
    			add_location(div22, file$1, 271, 20, 8419);
    			attr_dev(div23, "class", "value");
    			add_location(div23, file$1, 272, 20, 8478);
    			attr_dev(div24, "class", "attribute");
    			add_location(div24, file$1, 270, 16, 8375);
    			attr_dev(div25, "class", "overview");
    			add_location(div25, file$1, 220, 12, 6186);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$1, 297, 16, 9513);
    			set_style(div26, "text-align", "center");
    			set_style(div26, "margin-top", "3em");
    			add_location(div26, file$1, 296, 12, 9447);
    			attr_dev(div27, "class", "success");
    			add_location(div27, file$1, 214, 8, 5909);
    			add_location(main, file$1, 213, 4, 5894);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div27);
    			append_dev(div27, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, h1);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(div27, t5);
    			append_dev(div27, div25);
    			append_dev(div25, h4);
    			append_dev(div25, t7);
    			append_dev(div25, div3);
    			append_dev(div3, div1);
    			append_dev(div1, b0);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, t10);
    			append_dev(div25, t11);
    			append_dev(div25, div6);
    			append_dev(div6, div4);
    			append_dev(div4, b1);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, t14);
    			append_dev(div25, t15);
    			if (if_block0) if_block0.m(div25, null);
    			append_dev(div25, t16);
    			append_dev(div25, div9);
    			append_dev(div9, div7);
    			append_dev(div7, b2);
    			append_dev(div9, t18);
    			append_dev(div9, div8);
    			append_dev(div8, t19);
    			append_dev(div25, t20);
    			append_dev(div25, div12);
    			append_dev(div12, div10);
    			append_dev(div10, b3);
    			append_dev(div12, t22);
    			append_dev(div12, div11);
    			append_dev(div11, t23);
    			append_dev(div25, t24);
    			append_dev(div25, br);
    			append_dev(div25, t25);
    			append_dev(div25, div15);
    			append_dev(div15, div13);
    			append_dev(div13, b4);
    			append_dev(div15, t27);
    			append_dev(div15, div14);
    			append_dev(div14, t28);
    			append_dev(div25, t29);
    			append_dev(div25, div18);
    			append_dev(div18, div16);
    			append_dev(div16, b5);
    			append_dev(div18, t31);
    			append_dev(div18, div17);
    			append_dev(div17, t32);
    			append_dev(div25, t33);
    			append_dev(div25, div21);
    			append_dev(div21, div19);
    			append_dev(div19, b6);
    			append_dev(div21, t35);
    			append_dev(div21, div20);
    			append_dev(div20, t36);
    			append_dev(div25, t37);
    			append_dev(div25, div24);
    			append_dev(div24, div22);
    			append_dev(div22, b7);
    			append_dev(div24, t39);
    			append_dev(div24, div23);
    			append_dev(div23, t40);
    			append_dev(div23, t41);
    			append_dev(div25, t42);
    			if (if_block1) if_block1.m(div25, null);
    			append_dev(div27, t43);
    			append_dev(div27, div26);
    			append_dev(div26, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*reset*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inquiry*/ 8 && t10_value !== (t10_value = /*inquiry*/ ctx[3].id + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*inquiry*/ 8 && t14_value !== (t14_value = /*inquiry*/ ctx[3].name + "")) set_data_dev(t14, t14_value);

    			if (/*inquiry*/ ctx[3].company) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div25, t16);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*inquiry*/ 8 && t19_value !== (t19_value = /*inquiry*/ ctx[3].email + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*inquiry*/ 8 && t23_value !== (t23_value = /*inquiry*/ ctx[3].phone + "")) set_data_dev(t23, t23_value);

    			if (dirty & /*inquiry*/ 8 && t28_value !== (t28_value = new Date(/*inquiry*/ ctx[3].date).toLocaleDateString("de-DE", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric"
    			}) + "")) set_data_dev(t28, t28_value);

    			if (dirty & /*inquiry*/ 8 && t32_value !== (t32_value = /*inquiry*/ ctx[3].type + "")) set_data_dev(t32, t32_value);
    			if (dirty & /*inquiry*/ 8 && t36_value !== (t36_value = /*inquiry*/ ctx[3].locations.map(func).join(", ") + "")) set_data_dev(t36, t36_value);
    			if (dirty & /*inquiry*/ 8 && t40_value !== (t40_value = /*inquiry*/ ctx[3].amount_guests + "")) set_data_dev(t40, t40_value);

    			if (/*inquiry*/ ctx[3].text) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div25, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(213:0) {#if formState.matches(\\\"finished\\\")}",
    		ctx
    	});

    	return block;
    }

    // (314:8) {#if collapse("type")}
    function create_if_block_8(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let div1;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let select_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Was ist der Anlass des Events?";
    			t1 = space();
    			div1 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "auswählen...";
    			option1 = element("option");
    			option1.textContent = "Firmenfeier";
    			option2 = element("option");
    			option2.textContent = "Geburtstag";
    			option3 = element("option");
    			option3.textContent = "Hochzeit";
    			option4 = element("option");
    			option4.textContent = "Messe";
    			option5 = element("option");
    			option5.textContent = "Trauerfeier";
    			option6 = element("option");
    			option6.textContent = "Tagung";
    			option7 = element("option");
    			option7.textContent = "Sonstiges";
    			add_location(h3, file$1, 316, 20, 10198);
    			attr_dev(div0, "class", "col-md-8");
    			add_location(div0, file$1, 315, 16, 10155);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$1, 330, 24, 10773);
    			option1.__value = "Firmenfeier";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 331, 24, 10845);
    			option2.__value = "Geburtstag";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 332, 24, 10918);
    			option3.__value = "Hochzeit";
    			option3.value = option3.__value;
    			add_location(option3, file$1, 333, 24, 10989);
    			option4.__value = "Messe";
    			option4.value = option4.__value;
    			add_location(option4, file$1, 334, 24, 11056);
    			option5.__value = "Trauerfeier";
    			option5.value = option5.__value;
    			add_location(option5, file$1, 335, 24, 11117);
    			option6.__value = "Tagung";
    			option6.value = option6.__value;
    			add_location(option6, file$1, 336, 24, 11190);
    			option7.__value = "Sonstiges";
    			option7.value = option7.__value;
    			add_location(option7, file$1, 337, 24, 11253);

    			attr_dev(select, "class", select_class_value = [
    				"form-select",
    				"form-select-lg",
    				"no-border",
    				"selected-gold",
    				/*data*/ ctx[0].type ? "selected" : ""
    			].join(" "));

    			attr_dev(select, "data-type", "type");
    			if (/*data*/ ctx[0].type === void 0) add_render_callback(() => /*select_change_handler*/ ctx[8].call(select));
    			add_location(select, file$1, 319, 20, 10329);
    			attr_dev(div1, "class", "col-sm-6 col-md-4");
    			add_location(div1, file$1, 318, 16, 10277);
    			attr_dev(div2, "class", "row justify-content-center");
    			add_location(div2, file$1, 314, 12, 10098);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			append_dev(select, option6);
    			append_dev(select, option7);
    			select_option(select, /*data*/ ctx[0].type);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[8]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && select_class_value !== (select_class_value = [
    				"form-select",
    				"form-select-lg",
    				"no-border",
    				"selected-gold",
    				/*data*/ ctx[0].type ? "selected" : ""
    			].join(" "))) {
    				attr_dev(select, "class", select_class_value);
    			}

    			if (dirty & /*data*/ 1) {
    				select_option(select, /*data*/ ctx[0].type);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(314:8) {#if collapse(\\\"type\\\")}",
    		ctx
    	});

    	return block;
    }

    // (343:8) {#if collapse("amount_guests")}
    function create_if_block_7(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let div1;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let option9;
    	let option10;
    	let option11;
    	let option12;
    	let option13;
    	let option14;
    	let option15;
    	let option16;
    	let option17;
    	let option18;
    	let option19;
    	let option20;
    	let option21;
    	let option22;
    	let option23;
    	let option24;
    	let option25;
    	let option26;
    	let option27;
    	let option28;
    	let option29;
    	let option30;
    	let option31;
    	let option32;
    	let option33;
    	let option34;
    	let option35;
    	let option36;
    	let option37;
    	let select_class_value;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Mit wie vielen Gästen planen Sie?";
    			t1 = space();
    			div1 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "auswählen...";
    			option1 = element("option");
    			option1.textContent = "unter 50 Personen";
    			option2 = element("option");
    			option2.textContent = "50 Personen";
    			option3 = element("option");
    			option3.textContent = "60 Personen";
    			option4 = element("option");
    			option4.textContent = "70 Personen";
    			option5 = element("option");
    			option5.textContent = "80 Personen";
    			option6 = element("option");
    			option6.textContent = "90 Personen";
    			option7 = element("option");
    			option7.textContent = "100 Personen";
    			option8 = element("option");
    			option8.textContent = "110 Personen";
    			option9 = element("option");
    			option9.textContent = "120 Personen";
    			option10 = element("option");
    			option10.textContent = "130 Personen";
    			option11 = element("option");
    			option11.textContent = "140 Personen";
    			option12 = element("option");
    			option12.textContent = "150 Personen";
    			option13 = element("option");
    			option13.textContent = "160 Personen";
    			option14 = element("option");
    			option14.textContent = "170 Personen";
    			option15 = element("option");
    			option15.textContent = "180 Personen";
    			option16 = element("option");
    			option16.textContent = "190 Personen";
    			option17 = element("option");
    			option17.textContent = "200 Personen";
    			option18 = element("option");
    			option18.textContent = "250 Personen";
    			option19 = element("option");
    			option19.textContent = "300 Personen";
    			option20 = element("option");
    			option20.textContent = "350 Personen";
    			option21 = element("option");
    			option21.textContent = "400 Personen";
    			option22 = element("option");
    			option22.textContent = "450 Personen";
    			option23 = element("option");
    			option23.textContent = "500 Personen";
    			option24 = element("option");
    			option24.textContent = "600 Personen";
    			option25 = element("option");
    			option25.textContent = "700 Personen";
    			option26 = element("option");
    			option26.textContent = "800 Personen";
    			option27 = element("option");
    			option27.textContent = "900 Personen";
    			option28 = element("option");
    			option28.textContent = "1000 Personen";
    			option29 = element("option");
    			option29.textContent = "1500 Personen";
    			option30 = element("option");
    			option30.textContent = "2000 Personen";
    			option31 = element("option");
    			option31.textContent = "2500 Personen";
    			option32 = element("option");
    			option32.textContent = "3000 Personen";
    			option33 = element("option");
    			option33.textContent = "3500 Personen";
    			option34 = element("option");
    			option34.textContent = "4000 Personen";
    			option35 = element("option");
    			option35.textContent = "4500 Personen";
    			option36 = element("option");
    			option36.textContent = "5000 Personen";
    			option37 = element("option");
    			option37.textContent = "über 5000 Personen";
    			add_location(h3, file$1, 345, 20, 11553);
    			attr_dev(div0, "class", "col-md-8");
    			add_location(div0, file$1, 344, 16, 11510);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$1, 359, 24, 12151);
    			option1.__value = "unter 50";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 360, 24, 12223);
    			option2.__value = "50";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 361, 24, 12299);
    			option3.__value = "60";
    			option3.value = option3.__value;
    			add_location(option3, file$1, 362, 24, 12363);
    			option4.__value = "70";
    			option4.value = option4.__value;
    			add_location(option4, file$1, 363, 24, 12427);
    			option5.__value = "80";
    			option5.value = option5.__value;
    			add_location(option5, file$1, 364, 24, 12491);
    			option6.__value = "90";
    			option6.value = option6.__value;
    			add_location(option6, file$1, 365, 24, 12555);
    			option7.__value = "100";
    			option7.value = option7.__value;
    			add_location(option7, file$1, 366, 24, 12619);
    			option8.__value = "110";
    			option8.value = option8.__value;
    			add_location(option8, file$1, 367, 24, 12685);
    			option9.__value = "120";
    			option9.value = option9.__value;
    			add_location(option9, file$1, 368, 24, 12751);
    			option10.__value = "130";
    			option10.value = option10.__value;
    			add_location(option10, file$1, 369, 24, 12817);
    			option11.__value = "140";
    			option11.value = option11.__value;
    			add_location(option11, file$1, 370, 24, 12883);
    			option12.__value = "150";
    			option12.value = option12.__value;
    			add_location(option12, file$1, 371, 24, 12949);
    			option13.__value = "160";
    			option13.value = option13.__value;
    			add_location(option13, file$1, 372, 24, 13015);
    			option14.__value = "170";
    			option14.value = option14.__value;
    			add_location(option14, file$1, 373, 24, 13081);
    			option15.__value = "180";
    			option15.value = option15.__value;
    			add_location(option15, file$1, 374, 24, 13147);
    			option16.__value = "190";
    			option16.value = option16.__value;
    			add_location(option16, file$1, 375, 24, 13213);
    			option17.__value = "200";
    			option17.value = option17.__value;
    			add_location(option17, file$1, 376, 24, 13279);
    			option18.__value = "250";
    			option18.value = option18.__value;
    			add_location(option18, file$1, 377, 24, 13345);
    			option19.__value = "300";
    			option19.value = option19.__value;
    			add_location(option19, file$1, 378, 24, 13411);
    			option20.__value = "350";
    			option20.value = option20.__value;
    			add_location(option20, file$1, 379, 24, 13477);
    			option21.__value = "400";
    			option21.value = option21.__value;
    			add_location(option21, file$1, 380, 24, 13543);
    			option22.__value = "450";
    			option22.value = option22.__value;
    			add_location(option22, file$1, 381, 24, 13609);
    			option23.__value = "500";
    			option23.value = option23.__value;
    			add_location(option23, file$1, 382, 24, 13675);
    			option24.__value = "600";
    			option24.value = option24.__value;
    			add_location(option24, file$1, 383, 24, 13741);
    			option25.__value = "700";
    			option25.value = option25.__value;
    			add_location(option25, file$1, 384, 24, 13807);
    			option26.__value = "800";
    			option26.value = option26.__value;
    			add_location(option26, file$1, 385, 24, 13873);
    			option27.__value = "900";
    			option27.value = option27.__value;
    			add_location(option27, file$1, 386, 24, 13939);
    			option28.__value = "1000";
    			option28.value = option28.__value;
    			add_location(option28, file$1, 387, 24, 14005);
    			option29.__value = "1500";
    			option29.value = option29.__value;
    			add_location(option29, file$1, 388, 24, 14073);
    			option30.__value = "2000";
    			option30.value = option30.__value;
    			add_location(option30, file$1, 389, 24, 14141);
    			option31.__value = "2500";
    			option31.value = option31.__value;
    			add_location(option31, file$1, 390, 24, 14209);
    			option32.__value = "3000";
    			option32.value = option32.__value;
    			add_location(option32, file$1, 391, 24, 14277);
    			option33.__value = "3500";
    			option33.value = option33.__value;
    			add_location(option33, file$1, 392, 24, 14345);
    			option34.__value = "4000";
    			option34.value = option34.__value;
    			add_location(option34, file$1, 393, 24, 14413);
    			option35.__value = "4500";
    			option35.value = option35.__value;
    			add_location(option35, file$1, 394, 24, 14481);
    			option36.__value = "5000";
    			option36.value = option36.__value;
    			add_location(option36, file$1, 395, 24, 14549);
    			option37.__value = "5000+";
    			option37.value = option37.__value;
    			add_location(option37, file$1, 396, 24, 14617);

    			attr_dev(select, "class", select_class_value = [
    				"form-select",
    				"form-select-lg",
    				"no-border",
    				"selected-gold",
    				/*data*/ ctx[0].amount_guests ? "selected" : ""
    			].join(" "));

    			attr_dev(select, "data-type", "guests");
    			if (/*data*/ ctx[0].amount_guests === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[9].call(select));
    			add_location(select, file$1, 348, 20, 11687);
    			attr_dev(div1, "class", "col-sm-6 col-md-4");
    			add_location(div1, file$1, 347, 16, 11635);
    			attr_dev(div2, "class", "row justify-content-center");
    			add_location(div2, file$1, 343, 12, 11436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			append_dev(select, option6);
    			append_dev(select, option7);
    			append_dev(select, option8);
    			append_dev(select, option9);
    			append_dev(select, option10);
    			append_dev(select, option11);
    			append_dev(select, option12);
    			append_dev(select, option13);
    			append_dev(select, option14);
    			append_dev(select, option15);
    			append_dev(select, option16);
    			append_dev(select, option17);
    			append_dev(select, option18);
    			append_dev(select, option19);
    			append_dev(select, option20);
    			append_dev(select, option21);
    			append_dev(select, option22);
    			append_dev(select, option23);
    			append_dev(select, option24);
    			append_dev(select, option25);
    			append_dev(select, option26);
    			append_dev(select, option27);
    			append_dev(select, option28);
    			append_dev(select, option29);
    			append_dev(select, option30);
    			append_dev(select, option31);
    			append_dev(select, option32);
    			append_dev(select, option33);
    			append_dev(select, option34);
    			append_dev(select, option35);
    			append_dev(select, option36);
    			append_dev(select, option37);
    			select_option(select, /*data*/ ctx[0].amount_guests);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler_1*/ ctx[9]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*data*/ 1 && select_class_value !== (select_class_value = [
    				"form-select",
    				"form-select-lg",
    				"no-border",
    				"selected-gold",
    				/*data*/ ctx[0].amount_guests ? "selected" : ""
    			].join(" "))) {
    				attr_dev(select, "class", select_class_value);
    			}

    			if (dirty & /*data*/ 1) {
    				select_option(select, /*data*/ ctx[0].amount_guests);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(343:8) {#if collapse(\\\"amount_guests\\\")}",
    		ctx
    	});

    	return block;
    }

    // (402:8) {#if collapse("date")}
    function create_if_block_6(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let div1;
    	let input;
    	let input_class_value;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Wann soll das Event stattfinden?";
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			add_location(h3, file$1, 404, 20, 14913);
    			attr_dev(div0, "class", "col-md-8");
    			add_location(div0, file$1, 403, 16, 14870);
    			attr_dev(input, "type", "date");
    			attr_dev(input, "min", new Date().toISOString().split("T")[0]);

    			attr_dev(input, "class", input_class_value = [
    				"form-control",
    				"form-control-lg",
    				"selected-gold",
    				/*data*/ ctx[0].date ? "selected" : ""
    			].join(" "));

    			add_location(input, file$1, 407, 20, 15046);
    			attr_dev(div1, "class", "col-sm-6 col-md-4");
    			add_location(div1, file$1, 406, 16, 14994);
    			attr_dev(div2, "class", "row justify-content-center");
    			add_location(div2, file$1, 402, 12, 14796);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*data*/ ctx[0].date);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[10]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*data*/ 1 && input_class_value !== (input_class_value = [
    				"form-control",
    				"form-control-lg",
    				"selected-gold",
    				/*data*/ ctx[0].date ? "selected" : ""
    			].join(" "))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*data*/ 1) {
    				set_input_value(input, /*data*/ ctx[0].date);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(402:8) {#if collapse(\\\"date\\\")}",
    		ctx
    	});

    	return block;
    }

    // (422:8) {#if collapse("locations")}
    function create_if_block_5(ctx) {
    	let div10;
    	let h3;
    	let t1;
    	let div9;
    	let div6;
    	let div5;
    	let div0;
    	let input0;
    	let t2;
    	let label0;
    	let img0;
    	let img0_src_value;
    	let t3;
    	let div1;
    	let input1;
    	let t4;
    	let label1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div2;
    	let input2;
    	let t6;
    	let label2;
    	let img2;
    	let img2_src_value;
    	let t7;
    	let div3;
    	let input3;
    	let t8;
    	let label3;
    	let img3;
    	let img3_src_value;
    	let t9;
    	let div4;
    	let input4;
    	let t10;
    	let label4;
    	let img4;
    	let img4_src_value;
    	let t11;
    	let div8;
    	let div7;
    	let label5;
    	let input5;
    	let t12;
    	let t13;
    	let label6;
    	let input6;
    	let t14;
    	let t15;
    	let label7;
    	let input7;
    	let t16;
    	let t17;
    	let label8;
    	let input8;
    	let t18;
    	let t19;
    	let label9;
    	let input9;
    	let t20;
    	let t21;
    	let label10;
    	let input10;
    	let t22;
    	let t23;
    	let label11;
    	let input11;
    	let t24;
    	let div10_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Welche Locations sind für Sie interessant?";
    			t1 = space();
    			div9 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			label0 = element("label");
    			img0 = element("img");
    			t3 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t4 = space();
    			label1 = element("label");
    			img1 = element("img");
    			t5 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t6 = space();
    			label2 = element("label");
    			img2 = element("img");
    			t7 = space();
    			div3 = element("div");
    			input3 = element("input");
    			t8 = space();
    			label3 = element("label");
    			img3 = element("img");
    			t9 = space();
    			div4 = element("div");
    			input4 = element("input");
    			t10 = space();
    			label4 = element("label");
    			img4 = element("img");
    			t11 = space();
    			div8 = element("div");
    			div7 = element("div");
    			label5 = element("label");
    			input5 = element("input");
    			t12 = text("\n                                Inselresort Wilhelmstein");
    			t13 = space();
    			label6 = element("label");
    			input6 = element("input");
    			t14 = text("\n                                Cavallo");
    			t15 = space();
    			label7 = element("label");
    			input7 = element("input");
    			t16 = text("\n                                Classic Car Loft");
    			t17 = space();
    			label8 = element("label");
    			input8 = element("input");
    			t18 = text("\n                                Helmkehof");
    			t19 = space();
    			label9 = element("label");
    			input9 = element("input");
    			t20 = text("\n                                Rittergut Eckerde");
    			t21 = space();
    			label10 = element("label");
    			input10 = element("input");
    			t22 = text("\n                                Rittergut Remeringhausen");
    			t23 = space();
    			label11 = element("label");
    			input11 = element("input");
    			t24 = text("\n                                Eigene Räumlichkeiten");
    			attr_dev(h3, "class", "text-center mb-1");
    			add_location(h3, file$1, 423, 16, 15634);
    			attr_dev(input0, "type", "checkbox");
    			attr_dev(input0, "id", "location-input-5");
    			attr_dev(input0, "class", "form-check-input");
    			attr_dev(input0, "data-id", 5);
    			add_location(input0, file$1, 430, 32, 15999);
    			if (!src_url_equal(img0.src, img0_src_value = "https://partyloewe.de/images/logos/georgenterrassen_positiv.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Georgen Terrassen");
    			add_location(img0, file$1, 438, 36, 16422);
    			attr_dev(label0, "for", "location-input-5");
    			add_location(label0, file$1, 437, 32, 16355);
    			attr_dev(div0, "class", "col-6 col-md-4");
    			add_location(div0, file$1, 429, 28, 15938);
    			attr_dev(input1, "type", "checkbox");
    			attr_dev(input1, "id", "location-input-1");
    			attr_dev(input1, "class", "form-check-input");
    			attr_dev(input1, "data-id", 1);
    			add_location(input1, file$1, 445, 32, 16805);
    			if (!src_url_equal(img1.src, img1_src_value = "https://partyloewe.de/images/logos/yachtclub_positiv.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Yachtclub Hannover");
    			set_style(img1, "width", "120px");
    			add_location(img1, file$1, 453, 36, 17228);
    			attr_dev(label1, "for", "location-input-1");
    			add_location(label1, file$1, 452, 32, 17161);
    			attr_dev(div1, "class", "col-6 col-md-4");
    			add_location(div1, file$1, 444, 28, 16744);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "id", "location-input-6");
    			attr_dev(input2, "class", "form-check-input");
    			attr_dev(input2, "data-id", 6);
    			add_location(input2, file$1, 461, 32, 17666);
    			if (!src_url_equal(img2.src, img2_src_value = "https://partyloewe.de/images/logos/ralveshof_positiv.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Ralveshof Celle");
    			set_style(img2, "width", "120px");
    			add_location(img2, file$1, 469, 36, 18089);
    			attr_dev(label2, "for", "location-input-6");
    			add_location(label2, file$1, 468, 32, 18022);
    			attr_dev(div2, "class", "col-6 col-md-4");
    			add_location(div2, file$1, 460, 28, 17605);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "id", "location-input-7");
    			attr_dev(input3, "class", "form-check-input");
    			attr_dev(input3, "data-id", 7);
    			add_location(input3, file$1, 477, 32, 18524);
    			if (!src_url_equal(img3.src, img3_src_value = "https://partyloewe.de/images/logos/kokenhof_positiv.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Der Kokenhof");
    			set_style(img3, "width", "120px");
    			add_location(img3, file$1, 485, 36, 18947);
    			attr_dev(label3, "for", "location-input-7");
    			add_location(label3, file$1, 484, 32, 18880);
    			attr_dev(div3, "class", "col-6 col-md-4");
    			add_location(div3, file$1, 476, 28, 18463);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "id", "location-input-4");
    			attr_dev(input4, "class", "form-check-input");
    			attr_dev(input4, "data-id", 4);
    			add_location(input4, file$1, 493, 32, 19378);
    			if (!src_url_equal(img4.src, img4_src_value = "https://partyloewe.de/images/logos/schlossherrenhausen_positiv.svg")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "Schloss Herrenhausen");
    			add_location(img4, file$1, 501, 36, 19801);
    			attr_dev(label4, "for", "location-input-4");
    			add_location(label4, file$1, 500, 32, 19734);
    			attr_dev(div4, "class", "col-6 col-md-4");
    			add_location(div4, file$1, 492, 28, 19317);
    			attr_dev(div5, "class", "row justify-content-center");
    			add_location(div5, file$1, 428, 24, 15869);
    			attr_dev(div6, "class", "col-md-8 internal-locations");
    			add_location(div6, file$1, 427, 20, 15803);
    			attr_dev(input5, "class", "form-check-input me-1");
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "data-id", 3);
    			add_location(input5, file$1, 512, 32, 20377);
    			attr_dev(label5, "class", "list-group-item");
    			add_location(label5, file$1, 511, 28, 20313);
    			attr_dev(input6, "class", "form-check-input me-1");
    			attr_dev(input6, "type", "checkbox");
    			attr_dev(input6, "data-id", 9);
    			add_location(input6, file$1, 521, 32, 20834);
    			attr_dev(label6, "class", "list-group-item");
    			add_location(label6, file$1, 520, 28, 20770);
    			attr_dev(input7, "class", "form-check-input me-1");
    			attr_dev(input7, "type", "checkbox");
    			attr_dev(input7, "data-id", 10);
    			add_location(input7, file$1, 530, 32, 21274);
    			attr_dev(label7, "class", "list-group-item");
    			add_location(label7, file$1, 529, 28, 21210);
    			attr_dev(input8, "class", "form-check-input me-1");
    			attr_dev(input8, "type", "checkbox");
    			attr_dev(input8, "data-id", 11);
    			add_location(input8, file$1, 539, 32, 21724);
    			attr_dev(label8, "class", "list-group-item");
    			add_location(label8, file$1, 538, 28, 21660);
    			attr_dev(input9, "class", "form-check-input me-1");
    			attr_dev(input9, "type", "checkbox");
    			attr_dev(input9, "data-id", 12);
    			add_location(input9, file$1, 548, 32, 22167);
    			attr_dev(label9, "class", "list-group-item");
    			add_location(label9, file$1, 547, 28, 22103);
    			attr_dev(input10, "class", "form-check-input me-1");
    			attr_dev(input10, "type", "checkbox");
    			attr_dev(input10, "data-id", 13);
    			add_location(input10, file$1, 557, 32, 22618);
    			attr_dev(label10, "class", "list-group-item");
    			add_location(label10, file$1, 556, 28, 22554);
    			attr_dev(input11, "class", "form-check-input me-1");
    			attr_dev(input11, "type", "checkbox");
    			attr_dev(input11, "data-id", 8);
    			add_location(input11, file$1, 566, 32, 23076);
    			attr_dev(label11, "class", "list-group-item");
    			add_location(label11, file$1, 565, 28, 23012);
    			attr_dev(div7, "class", "list-group padding-helper");
    			add_location(div7, file$1, 510, 24, 20245);
    			attr_dev(div8, "class", "col-md-4 external-locations");
    			add_location(div8, file$1, 509, 20, 20179);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$1, 426, 16, 15765);
    			add_location(div10, file$1, 422, 12, 15595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h3);
    			append_dev(div10, t1);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t2);
    			append_dev(div0, label0);
    			append_dev(label0, img0);
    			append_dev(div5, t3);
    			append_dev(div5, div1);
    			append_dev(div1, input1);
    			append_dev(div1, t4);
    			append_dev(div1, label1);
    			append_dev(label1, img1);
    			append_dev(div5, t5);
    			append_dev(div5, div2);
    			append_dev(div2, input2);
    			append_dev(div2, t6);
    			append_dev(div2, label2);
    			append_dev(label2, img2);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div3, input3);
    			append_dev(div3, t8);
    			append_dev(div3, label3);
    			append_dev(label3, img3);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, input4);
    			append_dev(div4, t10);
    			append_dev(div4, label4);
    			append_dev(label4, img4);
    			append_dev(div9, t11);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, label5);
    			append_dev(label5, input5);
    			append_dev(label5, t12);
    			append_dev(div7, t13);
    			append_dev(div7, label6);
    			append_dev(label6, input6);
    			append_dev(label6, t14);
    			append_dev(div7, t15);
    			append_dev(div7, label7);
    			append_dev(label7, input7);
    			append_dev(label7, t16);
    			append_dev(div7, t17);
    			append_dev(div7, label8);
    			append_dev(label8, input8);
    			append_dev(label8, t18);
    			append_dev(div7, t19);
    			append_dev(div7, label9);
    			append_dev(label9, input9);
    			append_dev(label9, t20);
    			append_dev(div7, t21);
    			append_dev(div7, label10);
    			append_dev(label10, input10);
    			append_dev(label10, t22);
    			append_dev(div7, t23);
    			append_dev(div7, label11);
    			append_dev(label11, input11);
    			append_dev(label11, t24);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input1, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input2, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input3, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input4, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input5, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input6, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input7, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input8, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input9, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input10, "change", /*locationSelect*/ ctx[7], false, false, false),
    					listen_dev(input11, "change", /*locationSelect*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div10_transition) div10_transition = create_bidirectional_transition(div10, scale, {}, true);
    				div10_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div10_transition) div10_transition = create_bidirectional_transition(div10, scale, {}, false);
    			div10_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if (detaching && div10_transition) div10_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(422:8) {#if collapse(\\\"locations\\\")}",
    		ctx
    	});

    	return block;
    }

    // (580:8) {#if collapse("contact")}
    function create_if_block_3(ctx) {
    	let div18;
    	let div1;
    	let div0;
    	let h40;
    	let t1;
    	let textarea;
    	let textarea_class_value;
    	let t2;
    	let div4;
    	let div2;
    	let h41;
    	let t4;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t8;
    	let div3;
    	let h42;
    	let t10;
    	let input0;
    	let input0_class_value;
    	let t11;
    	let div6;
    	let div5;
    	let h43;
    	let t13;
    	let input1;
    	let input1_class_value;
    	let t14;
    	let div8;
    	let div7;
    	let h44;
    	let t16;
    	let input2;
    	let input2_class_value;
    	let t17;
    	let div11;
    	let div9;
    	let h45;
    	let t19;
    	let input3;
    	let input3_class_value;
    	let t20;
    	let div10;
    	let h46;
    	let t22;
    	let input4;
    	let input4_class_value;
    	let t23;
    	let div14;
    	let div12;
    	let h47;
    	let t25;
    	let input5;
    	let input5_class_value;
    	let t26;
    	let div13;
    	let h48;
    	let t28;
    	let input6;
    	let input6_class_value;
    	let t29;
    	let div17;
    	let div16;
    	let button;
    	let show_if;
    	let button_disabled_value;
    	let t30;
    	let div15;
    	let t31;
    	let div15_hidden_value;
    	let div18_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (dirty & /*apiState*/ 2) show_if = null;
    		if (show_if == null) show_if = !!/*apiState*/ ctx[1].matches("loading");
    		if (show_if) return create_if_block_4;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Haben Sie sonstige Anmerkungen?";
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			div4 = element("div");
    			div2 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Anrede";
    			t4 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Herr";
    			option1 = element("option");
    			option1.textContent = "Frau";
    			option2 = element("option");
    			option2.textContent = "Divers";
    			t8 = space();
    			div3 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Vor- und Nachname*";
    			t10 = space();
    			input0 = element("input");
    			t11 = space();
    			div6 = element("div");
    			div5 = element("div");
    			h43 = element("h4");
    			h43.textContent = "Firma";
    			t13 = space();
    			input1 = element("input");
    			t14 = space();
    			div8 = element("div");
    			div7 = element("div");
    			h44 = element("h4");
    			h44.textContent = "Straße und Hausnummer*";
    			t16 = space();
    			input2 = element("input");
    			t17 = space();
    			div11 = element("div");
    			div9 = element("div");
    			h45 = element("h4");
    			h45.textContent = "PLZ*";
    			t19 = space();
    			input3 = element("input");
    			t20 = space();
    			div10 = element("div");
    			h46 = element("h4");
    			h46.textContent = "Ort*";
    			t22 = space();
    			input4 = element("input");
    			t23 = space();
    			div14 = element("div");
    			div12 = element("div");
    			h47 = element("h4");
    			h47.textContent = "Email*";
    			t25 = space();
    			input5 = element("input");
    			t26 = space();
    			div13 = element("div");
    			h48 = element("h4");
    			h48.textContent = "Telefon*";
    			t28 = space();
    			input6 = element("input");
    			t29 = space();
    			div17 = element("div");
    			div16 = element("div");
    			button = element("button");
    			if_block.c();
    			t30 = space();
    			div15 = element("div");
    			t31 = text("Ein Problem ist aufgetreten, bitte versuchen Sie es\n                            später erneut.");
    			add_location(h40, file$1, 583, 24, 23745);
    			attr_dev(textarea, "class", textarea_class_value = ["form-control", /*data*/ ctx[0].text ? "selected" : ""].join(" "));
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$1, 584, 24, 23810);
    			attr_dev(div0, "class", "col-md-8");
    			add_location(div0, file$1, 582, 20, 23698);
    			attr_dev(div1, "class", "row justify-content-center");
    			add_location(div1, file$1, 581, 16, 23637);
    			add_location(h41, file$1, 596, 24, 24312);
    			option0.__value = "Herr";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file$1, 601, 28, 24534);
    			option1.__value = "Frau";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 602, 28, 24606);
    			option2.__value = "";
    			option2.value = option2.__value;
    			add_location(option2, file$1, 603, 28, 24669);
    			attr_dev(select, "class", "form-select form-select-lg");
    			if (/*data*/ ctx[0].salutation === void 0) add_render_callback(() => /*select_change_handler_2*/ ctx[12].call(select));
    			add_location(select, file$1, 597, 24, 24352);
    			attr_dev(div2, "class", "col-md-2 margin-on-break");
    			add_location(div2, file$1, 595, 20, 24249);
    			add_location(h42, file$1, 607, 24, 24830);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "autocomplete", "given-name");

    			attr_dev(input0, "class", input0_class_value = [
    				"form-control",
    				"form-control-lg",
    				/*data*/ ctx[0].company ? "selected" : ""
    			].join(" "));

    			add_location(input0, file$1, 608, 24, 24882);
    			attr_dev(div3, "class", "col-md-6");
    			add_location(div3, file$1, 606, 20, 24783);
    			attr_dev(div4, "class", "row justify-content-center");
    			add_location(div4, file$1, 594, 16, 24188);
    			add_location(h43, file$1, 622, 24, 25476);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "autocomplete", "organization");

    			attr_dev(input1, "class", input1_class_value = [
    				"form-control",
    				"form-control-lg",
    				/*data*/ ctx[0].company ? "selected" : ""
    			].join(" "));

    			add_location(input1, file$1, 623, 24, 25515);
    			attr_dev(div5, "class", "col-md-8");
    			add_location(div5, file$1, 621, 20, 25429);
    			attr_dev(div6, "class", "row justify-content-center");
    			add_location(div6, file$1, 620, 16, 25368);
    			add_location(h44, file$1, 637, 24, 26114);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "autocomplete", "street-address");

    			attr_dev(input2, "class", input2_class_value = [
    				"form-control",
    				"form-control-lg",
    				/*data*/ ctx[0].street ? "selected" : ""
    			].join(" "));

    			add_location(input2, file$1, 638, 24, 26170);
    			attr_dev(div7, "class", "col-md-8");
    			add_location(div7, file$1, 636, 20, 26067);
    			attr_dev(div8, "class", "row justify-content-center");
    			add_location(div8, file$1, 635, 16, 26006);
    			add_location(h45, file$1, 652, 24, 26785);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "autocomplete", "postal-code");
    			attr_dev(input3, "class", input3_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].zip ? "selected" : ""].join(" "));
    			add_location(input3, file$1, 653, 24, 26823);
    			attr_dev(div9, "class", "col-md-3 margin-on-break");
    			add_location(div9, file$1, 651, 20, 26722);
    			add_location(h46, file$1, 665, 24, 27333);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "autocomplete", "city");
    			attr_dev(input4, "class", input4_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].city ? "selected" : ""].join(" "));
    			add_location(input4, file$1, 666, 24, 27371);
    			attr_dev(div10, "class", "col-md-5");
    			add_location(div10, file$1, 664, 20, 27286);
    			attr_dev(div11, "class", "row justify-content-center");
    			add_location(div11, file$1, 650, 16, 26661);
    			add_location(h47, file$1, 680, 24, 27972);
    			attr_dev(input5, "type", "email");
    			attr_dev(input5, "autocomplete", "email");
    			attr_dev(input5, "class", input5_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].email ? "selected" : ""].join(" "));
    			add_location(input5, file$1, 681, 24, 28012);
    			attr_dev(div12, "class", "col-md-4 margin-on-break");
    			add_location(div12, file$1, 679, 20, 27909);
    			add_location(h48, file$1, 693, 24, 28521);
    			attr_dev(input6, "type", "text");
    			attr_dev(input6, "autocomplete", "tel");
    			attr_dev(input6, "class", input6_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].phone ? "selected" : ""].join(" "));
    			add_location(input6, file$1, 694, 24, 28563);
    			attr_dev(div13, "class", "col-md-4");
    			add_location(div13, file$1, 692, 20, 28474);
    			attr_dev(div14, "class", "row justify-content-center");
    			add_location(div14, file$1, 678, 16, 27848);
    			set_style(button, "width", "100%");
    			set_style(button, "margin-bottom", "1em");
    			attr_dev(button, "class", "btn btn-primary btn-lg");
    			attr_dev(button, "type", "button");
    			button.disabled = button_disabled_value = /*apiState*/ ctx[1].matches("loading") || !/*data*/ ctx[0].name || !/*data*/ ctx[0].street || !/*data*/ ctx[0].zip || !/*data*/ ctx[0].city || !/*data*/ ctx[0].email || !/*data*/ ctx[0].phone;
    			add_location(button, file$1, 708, 24, 29149);
    			attr_dev(div15, "class", "alert alert-danger");
    			attr_dev(div15, "role", "alert");
    			div15.hidden = div15_hidden_value = !/*apiState*/ ctx[1].matches("error");
    			add_location(div15, file$1, 731, 24, 30255);
    			attr_dev(div16, "class", "col-md-6");
    			add_location(div16, file$1, 707, 20, 29102);
    			attr_dev(div17, "class", "row justify-content-center");
    			add_location(div17, file$1, 706, 16, 29041);
    			add_location(div18, file$1, 580, 12, 23598);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h40);
    			append_dev(div0, t1);
    			append_dev(div0, textarea);
    			set_input_value(textarea, /*data*/ ctx[0].text);
    			append_dev(div18, t2);
    			append_dev(div18, div4);
    			append_dev(div4, div2);
    			append_dev(div2, h41);
    			append_dev(div2, t4);
    			append_dev(div2, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*data*/ ctx[0].salutation);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, h42);
    			append_dev(div3, t10);
    			append_dev(div3, input0);
    			set_input_value(input0, /*data*/ ctx[0].name);
    			append_dev(div18, t11);
    			append_dev(div18, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h43);
    			append_dev(div5, t13);
    			append_dev(div5, input1);
    			set_input_value(input1, /*data*/ ctx[0].company);
    			append_dev(div18, t14);
    			append_dev(div18, div8);
    			append_dev(div8, div7);
    			append_dev(div7, h44);
    			append_dev(div7, t16);
    			append_dev(div7, input2);
    			set_input_value(input2, /*data*/ ctx[0].street);
    			append_dev(div18, t17);
    			append_dev(div18, div11);
    			append_dev(div11, div9);
    			append_dev(div9, h45);
    			append_dev(div9, t19);
    			append_dev(div9, input3);
    			set_input_value(input3, /*data*/ ctx[0].zip);
    			append_dev(div11, t20);
    			append_dev(div11, div10);
    			append_dev(div10, h46);
    			append_dev(div10, t22);
    			append_dev(div10, input4);
    			set_input_value(input4, /*data*/ ctx[0].city);
    			append_dev(div18, t23);
    			append_dev(div18, div14);
    			append_dev(div14, div12);
    			append_dev(div12, h47);
    			append_dev(div12, t25);
    			append_dev(div12, input5);
    			set_input_value(input5, /*data*/ ctx[0].email);
    			append_dev(div14, t26);
    			append_dev(div14, div13);
    			append_dev(div13, h48);
    			append_dev(div13, t28);
    			append_dev(div13, input6);
    			set_input_value(input6, /*data*/ ctx[0].phone);
    			append_dev(div18, t29);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, button);
    			if_block.m(button, null);
    			append_dev(div16, t30);
    			append_dev(div16, div15);
    			append_dev(div15, t31);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[11]),
    					listen_dev(select, "change", /*select_change_handler_2*/ ctx[12]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[15]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[16]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[17]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[18]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[19]),
    					listen_dev(button, "click", /*submit*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*data*/ 1 && textarea_class_value !== (textarea_class_value = ["form-control", /*data*/ ctx[0].text ? "selected" : ""].join(" "))) {
    				attr_dev(textarea, "class", textarea_class_value);
    			}

    			if (dirty & /*data*/ 1) {
    				set_input_value(textarea, /*data*/ ctx[0].text);
    			}

    			if (dirty & /*data*/ 1) {
    				select_option(select, /*data*/ ctx[0].salutation);
    			}

    			if (!current || dirty & /*data*/ 1 && input0_class_value !== (input0_class_value = [
    				"form-control",
    				"form-control-lg",
    				/*data*/ ctx[0].company ? "selected" : ""
    			].join(" "))) {
    				attr_dev(input0, "class", input0_class_value);
    			}

    			if (dirty & /*data*/ 1 && input0.value !== /*data*/ ctx[0].name) {
    				set_input_value(input0, /*data*/ ctx[0].name);
    			}

    			if (!current || dirty & /*data*/ 1 && input1_class_value !== (input1_class_value = [
    				"form-control",
    				"form-control-lg",
    				/*data*/ ctx[0].company ? "selected" : ""
    			].join(" "))) {
    				attr_dev(input1, "class", input1_class_value);
    			}

    			if (dirty & /*data*/ 1 && input1.value !== /*data*/ ctx[0].company) {
    				set_input_value(input1, /*data*/ ctx[0].company);
    			}

    			if (!current || dirty & /*data*/ 1 && input2_class_value !== (input2_class_value = [
    				"form-control",
    				"form-control-lg",
    				/*data*/ ctx[0].street ? "selected" : ""
    			].join(" "))) {
    				attr_dev(input2, "class", input2_class_value);
    			}

    			if (dirty & /*data*/ 1 && input2.value !== /*data*/ ctx[0].street) {
    				set_input_value(input2, /*data*/ ctx[0].street);
    			}

    			if (!current || dirty & /*data*/ 1 && input3_class_value !== (input3_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].zip ? "selected" : ""].join(" "))) {
    				attr_dev(input3, "class", input3_class_value);
    			}

    			if (dirty & /*data*/ 1 && input3.value !== /*data*/ ctx[0].zip) {
    				set_input_value(input3, /*data*/ ctx[0].zip);
    			}

    			if (!current || dirty & /*data*/ 1 && input4_class_value !== (input4_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].city ? "selected" : ""].join(" "))) {
    				attr_dev(input4, "class", input4_class_value);
    			}

    			if (dirty & /*data*/ 1 && input4.value !== /*data*/ ctx[0].city) {
    				set_input_value(input4, /*data*/ ctx[0].city);
    			}

    			if (!current || dirty & /*data*/ 1 && input5_class_value !== (input5_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].email ? "selected" : ""].join(" "))) {
    				attr_dev(input5, "class", input5_class_value);
    			}

    			if (dirty & /*data*/ 1 && input5.value !== /*data*/ ctx[0].email) {
    				set_input_value(input5, /*data*/ ctx[0].email);
    			}

    			if (!current || dirty & /*data*/ 1 && input6_class_value !== (input6_class_value = ["form-control", "form-control-lg", /*data*/ ctx[0].phone ? "selected" : ""].join(" "))) {
    				attr_dev(input6, "class", input6_class_value);
    			}

    			if (dirty & /*data*/ 1 && input6.value !== /*data*/ ctx[0].phone) {
    				set_input_value(input6, /*data*/ ctx[0].phone);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx, dirty))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}

    			if (!current || dirty & /*apiState, data*/ 3 && button_disabled_value !== (button_disabled_value = /*apiState*/ ctx[1].matches("loading") || !/*data*/ ctx[0].name || !/*data*/ ctx[0].street || !/*data*/ ctx[0].zip || !/*data*/ ctx[0].city || !/*data*/ ctx[0].email || !/*data*/ ctx[0].phone)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (!current || dirty & /*apiState*/ 2 && div15_hidden_value !== (div15_hidden_value = !/*apiState*/ ctx[1].matches("error"))) {
    				prop_dev(div15, "hidden", div15_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div18_transition) div18_transition = create_bidirectional_transition(div18, scale, {}, true);
    				div18_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div18_transition) div18_transition = create_bidirectional_transition(div18, scale, {}, false);
    			div18_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    			if_block.d();
    			if (detaching && div18_transition) div18_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(580:8) {#if collapse(\\\"contact\\\")}",
    		ctx
    	});

    	return block;
    }

    // (728:28) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Abschicken");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(728:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (722:28) {#if apiState.matches("loading")}
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "spinner-border");
    			attr_dev(div, "role", "status");
    			set_style(div, "width", "1.3rem");
    			set_style(div, "height", "1.3rem");
    			set_style(div, "border-width", "0.2rem");
    			add_location(div, file$1, 722, 32, 29838);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(722:28) {#if apiState.matches(\\\"loading\\\")}",
    		ctx
    	});

    	return block;
    }

    // (233:16) {#if inquiry.company}
    function create_if_block_2(ctx) {
    	let div2;
    	let div0;
    	let b;
    	let t1;
    	let div1;
    	let t2_value = /*inquiry*/ ctx[3].company + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			b = element("b");
    			b.textContent = "Firma:";
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			add_location(b, file$1, 234, 43, 6836);
    			attr_dev(div0, "class", "label");
    			add_location(div0, file$1, 234, 24, 6817);
    			attr_dev(div1, "class", "value");
    			add_location(div1, file$1, 235, 24, 6880);
    			attr_dev(div2, "class", "attribute");
    			add_location(div2, file$1, 233, 20, 6769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, b);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inquiry*/ 8 && t2_value !== (t2_value = /*inquiry*/ ctx[3].company + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(233:16) {#if inquiry.company}",
    		ctx
    	});

    	return block;
    }

    // (289:16) {#if inquiry.text}
    function create_if_block_1(ctx) {
    	let br;
    	let t0;
    	let div2;
    	let div0;
    	let b;
    	let t2;
    	let div1;
    	let t3_value = /*inquiry*/ ctx[3].text + "";
    	let t3;

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			b = element("b");
    			b.textContent = "Anmerkungen:";
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			add_location(br, file$1, 289, 20, 9183);
    			add_location(b, file$1, 291, 43, 9277);
    			attr_dev(div0, "class", "label");
    			add_location(div0, file$1, 291, 24, 9258);
    			attr_dev(div1, "class", "value");
    			add_location(div1, file$1, 292, 24, 9327);
    			attr_dev(div2, "class", "attribute");
    			add_location(div2, file$1, 290, 20, 9210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, b);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inquiry*/ 8 && t3_value !== (t3_value = /*inquiry*/ ctx[3].text + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(289:16) {#if inquiry.text}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*formState*/ 4) show_if = null;
    		if (show_if == null) show_if = !!/*formState*/ ctx[2].matches("finished");
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			this.c = noop;
    			attr_dev(link0, "href", "https://fonts.googleapis.com/css?family=Montserrat");
    			attr_dev(link0, "rel", "stylesheet");
    			add_location(link0, file$1, 201, 0, 5532);
    			attr_dev(link1, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css");
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "integrity", "sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3");
    			attr_dev(link1, "crossorigin", "anonymous");
    			add_location(link1, file$1, 205, 0, 5624);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, link1, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(link1);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = location => location.name;

    function instance$1($$self, $$props, $$invalidate) {
    	let inquiry;
    	let data;
    	let collapse;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('pl-inquiry', slots, []);
    	let apiState = false;
    	let formState = false;

    	const apiMachine = createMachine({
    		id: "api",
    		initial: "inactive",
    		states: {
    			inactive: { on: { SUBMIT: { target: "loading" } } },
    			loading: {
    				on: {
    					RESOLVE: { target: "success" },
    					REJECT: { target: "error" }
    				}
    			},
    			success: {},
    			error: { on: { SUBMIT: { target: "loading" } } }
    		}
    	});

    	const apiService = interpret(apiMachine).onTransition(state => $$invalidate(1, apiState = state)).start();

    	const formMachine = createMachine({
    		id: "form",
    		initial: "new",
    		states: {
    			new: {
    				on: {
    					NEXT: { target: "finished" },
    					SKIP: { target: "finished" }
    				}
    			},
    			finished: { on: { RESET: { target: "new" } } }
    		}
    	});

    	const formService = interpret(formMachine).onTransition(state => $$invalidate(2, formState = state)).start();

    	onMount(() => {
    		const storedInquiry = JSON.parse(localStorage.getItem("event-inquiry"));

    		if (storedInquiry) {
    			let createdAt = new Date(storedInquiry.created_at);
    			createdAt = createdAt.toISOString().split("T")[0];
    			let threshold = new Date();
    			threshold.setTime(threshold.getTime() - 2629800000);
    			threshold = threshold.toISOString().split("T")[0];

    			if (threshold > createdAt) {
    				localStorage.removeItem("event-inquiry");
    			} else {
    				$$invalidate(3, inquiry = storedInquiry);
    				formService.send("SKIP");
    			}
    		}
    	});

    	async function submit() {
    		try {
    			apiService.send("SUBMIT");
    			let temp = { ...data };
    			temp.catering_needed = data.catering_needed === "true" ? true : false;
    			temp.technic_needed = data.technic_needed === "true" ? true : false;
    			if (!temp.company) delete temp.company;
    			if (!temp.text) delete temp.text;
    			const response = await http.post("event-inquiries/submit", { json: temp }).json();
    			localStorage.removeItem("autosave");
    			localStorage.setItem("event-inquiry", JSON.stringify(response));
    			$$invalidate(3, inquiry = response);
    			apiService.send("RESOLVE");
    			formService.send("NEXT");
    		} catch(err) {
    			console.log(err);
    			apiService.send("REJECT");
    		}
    	}

    	function reset() {
    		$$invalidate(0, data = {
    			name: null,
    			salutation: "Herr",
    			company: null,
    			street: null,
    			zip: null,
    			city: null,
    			email: null,
    			phone: null,
    			type: "",
    			date: null,
    			locations: [],
    			amount_guests: "",
    			catering_needed: "",
    			technic_needed: "",
    			text: null,
    			website: null
    		});

    		formService.send("RESET");
    	}

    	function locationSelect() {
    		if (this.checked) {
    			$$invalidate(0, data.locations = [...data.locations, Number(this.dataset.id)], data);
    		} else {
    			$$invalidate(0, data.locations = data.locations.filter(location => location !== Number(this.dataset.id)), data);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<pl-inquiry> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		data.type = select_value(this);
    		$$invalidate(0, data);
    	}

    	function select_change_handler_1() {
    		data.amount_guests = select_value(this);
    		$$invalidate(0, data);
    	}

    	function input_input_handler() {
    		data.date = this.value;
    		$$invalidate(0, data);
    	}

    	function textarea_input_handler() {
    		data.text = this.value;
    		$$invalidate(0, data);
    	}

    	function select_change_handler_2() {
    		data.salutation = select_value(this);
    		$$invalidate(0, data);
    	}

    	function input0_input_handler() {
    		data.name = this.value;
    		$$invalidate(0, data);
    	}

    	function input1_input_handler() {
    		data.company = this.value;
    		$$invalidate(0, data);
    	}

    	function input2_input_handler() {
    		data.street = this.value;
    		$$invalidate(0, data);
    	}

    	function input3_input_handler() {
    		data.zip = this.value;
    		$$invalidate(0, data);
    	}

    	function input4_input_handler() {
    		data.city = this.value;
    		$$invalidate(0, data);
    	}

    	function input5_input_handler() {
    		data.email = this.value;
    		$$invalidate(0, data);
    	}

    	function input6_input_handler() {
    		data.phone = this.value;
    		$$invalidate(0, data);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		createMachine,
    		interpret,
    		http,
    		scale,
    		apiState,
    		formState,
    		apiMachine,
    		apiService,
    		formMachine,
    		formService,
    		submit,
    		reset,
    		locationSelect,
    		data,
    		inquiry,
    		collapse
    	});

    	$$self.$inject_state = $$props => {
    		if ('apiState' in $$props) $$invalidate(1, apiState = $$props.apiState);
    		if ('formState' in $$props) $$invalidate(2, formState = $$props.formState);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('inquiry' in $$props) $$invalidate(3, inquiry = $$props.inquiry);
    		if ('collapse' in $$props) $$invalidate(4, collapse = $$props.collapse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 1) {
    			$$invalidate(4, collapse = key => {
    				let result = false;

    				switch (key) {
    					case "type":
    						result = true;
    						break;
    					case "amount_guests":
    						result = data.type;
    						break;
    					case "date":
    						result = data.type && data.amount_guests;
    						break;
    					case "locations":
    						result = data.type && data.amount_guests && data.date;
    						break;
    					case "catering_needed":
    						result = data.type && data.amount_guests && data.date && data.locations.length;
    						break;
    					case "technic_needed":
    						result = data.type && data.amount_guests && data.date && data.locations.length && data.catering_needed;
    						break;
    					case "contact":
    						result = data.type && data.amount_guests && data.date && data.locations.length;
    						break;
    				}

    				return result;
    			});
    		}
    	};

    	$$invalidate(3, inquiry = false);

    	$$invalidate(0, data = {
    		name: null,
    		salutation: "Herr",
    		company: null,
    		street: null,
    		zip: null,
    		city: null,
    		email: null,
    		phone: null,
    		type: "",
    		date: null,
    		locations: [],
    		amount_guests: "",
    		catering_needed: "",
    		technic_needed: "",
    		text: null
    	});

    	return [
    		data,
    		apiState,
    		formState,
    		inquiry,
    		collapse,
    		submit,
    		reset,
    		locationSelect,
    		select_change_handler,
    		select_change_handler_1,
    		input_input_handler,
    		textarea_input_handler,
    		select_change_handler_2,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler
    	];
    }

    class EventInquiry extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>main{font-family:"Montserrat", "Helvetica", "Arial";padding-bottom:6em}.success{max-width:1000px;margin:0 auto}.header{text-align:center;margin-bottom:48px}.header h1{font-weight:bold;margin:12px 0}.overview{max-width:500px;margin:0 auto;padding:0 1em;line-height:1.5em}.overview .attribute{margin-top:0.5em}.overview .label{float:left;width:150px;overflow:hidden}.overview .value{overflow:hidden}.row{margin:0 auto !important;margin-bottom:2em !important;max-width:1000px}h3{margin-bottom:1em;text-align:center}h4{font-size:1.3rem !important}.no-border,input[type="date"]{border:none !important}select:focus,input:focus,textarea:focus{box-shadow:none !important}.selected.selected-gold{color:#b28d2f !important;font-size:1.5em !important;font-weight:bold !important}.form-check-input:checked{background-color:#b28d2f !important;border-color:#b28d2f !important}.btn-primary{background-color:#b28d2f !important;border-color:#b28d2f !important}.btn-primary:hover{background-color:#9e7d29 !important;border-color:#9e7d29 !important}.margin-on-break{margin-bottom:3em !important}@media only screen and (min-width: 768px){.success .header{margin-bottom:48px}h3{text-align:left}.row{margin-bottom:3em !important}.margin-on-break{margin-bottom:0 !important}.padding-helper{padding-top:3em}}.internal-locations input[type="checkbox"][id^="location"]{position:relative;top:37px;left:6px;z-index:1}.internal-locations input[type="checkbox"]:checked{background-color:#b28d2f !important;border-color:#b28d2f !important}.internal-locations label{padding:10px;display:block;position:relative;margin:10px;cursor:pointer}.internal-locations label:before{background-color:white;color:white;content:" ";display:block;border-radius:50%;border:1px solid #b28d2f;position:absolute;top:-5px;left:-5px;width:25px;height:25px;text-align:center;line-height:28px;transition-duration:0.4s;transform:scale(0);position:absolute;top:6px;z-index:1}.internal-locations label img{height:100px;width:100px;transition-duration:0.2s;transform-origin:50% 50%}.internal-locations :checked+label img{transform:scale(1.1);z-index:-1}.internal-locations :hover+label img{transform:scale(1.1);z-index:-1}.external-locations .list-group-item{border:none}</style>`;

    		init$1(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("pl-inquiry", EventInquiry);

    /* src/Jobs.svelte generated by Svelte v3.46.2 */
    const file = "src/Jobs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (67:16) {#each companies as company}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*company*/ ctx[13].shortname + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*company*/ ctx[13].id;
    			option.value = option.__value;
    			add_location(option, file, 67, 20, 1811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*companies*/ 8 && t_value !== (t_value = /*company*/ ctx[13].shortname + "")) set_data_dev(t, t_value);

    			if (dirty & /*companies*/ 8 && option_value_value !== (option_value_value = /*company*/ ctx[13].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(67:16) {#each companies as company}",
    		ctx
    	});

    	return block;
    }

    // (130:16) {#if showDetails === job.id}
    function create_if_block(ctx) {
    	let tr;
    	let td;
    	let h30;
    	let t1;
    	let t2_value = /*job*/ ctx[10].description + "";
    	let t2;
    	let t3;
    	let br0;
    	let t4;
    	let br1;
    	let t5;
    	let h31;
    	let t7;
    	let pre0;
    	let t8_value = /*job*/ ctx[10].todos + "";
    	let t8;
    	let t9;
    	let h32;
    	let t11;
    	let pre1;
    	let t12_value = /*job*/ ctx[10].benefits + "";
    	let t12;
    	let t13;
    	let h33;
    	let t15;
    	let pre2;
    	let t16_value = /*job*/ ctx[10].requirements + "";
    	let t16;
    	let t17;
    	let tr_class_value;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			h30 = element("h3");
    			h30.textContent = "Beschreibung";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			br1 = element("br");
    			t5 = space();
    			h31 = element("h3");
    			h31.textContent = "Deine Aufgaben";
    			t7 = space();
    			pre0 = element("pre");
    			t8 = text(t8_value);
    			t9 = space();
    			h32 = element("h3");
    			h32.textContent = "Das kannst du erwarten";
    			t11 = space();
    			pre1 = element("pre");
    			t12 = text(t12_value);
    			t13 = space();
    			h33 = element("h3");
    			h33.textContent = "Das solltest du mitbringen";
    			t15 = space();
    			pre2 = element("pre");
    			t16 = text(t16_value);
    			t17 = space();
    			add_location(h30, file, 136, 28, 4241);
    			add_location(br0, file, 138, 28, 4337);
    			add_location(br1, file, 139, 28, 4372);
    			add_location(h31, file, 140, 28, 4407);
    			add_location(pre0, file, 141, 28, 4459);
    			add_location(h32, file, 142, 28, 4510);
    			add_location(pre1, file, 143, 28, 4570);
    			add_location(h33, file, 144, 28, 4624);
    			add_location(pre2, file, 145, 28, 4688);
    			attr_dev(td, "colspan", "12");
    			add_location(td, file, 135, 24, 4195);

    			attr_dev(tr, "class", tr_class_value = /*showDetails*/ ctx[0] === /*job*/ ctx[10].id
    			? "details-row expanded"
    			: "details-row");

    			add_location(tr, file, 130, 20, 3993);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    			append_dev(td, h30);
    			append_dev(td, t1);
    			append_dev(td, t2);
    			append_dev(td, t3);
    			append_dev(td, br0);
    			append_dev(td, t4);
    			append_dev(td, br1);
    			append_dev(td, t5);
    			append_dev(td, h31);
    			append_dev(td, t7);
    			append_dev(td, pre0);
    			append_dev(pre0, t8);
    			append_dev(td, t9);
    			append_dev(td, h32);
    			append_dev(td, t11);
    			append_dev(td, pre1);
    			append_dev(pre1, t12);
    			append_dev(td, t13);
    			append_dev(td, h33);
    			append_dev(td, t15);
    			append_dev(td, pre2);
    			append_dev(pre2, t16);
    			append_dev(tr, t17);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*jobs*/ 4 && t2_value !== (t2_value = /*job*/ ctx[10].description + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*jobs*/ 4 && t8_value !== (t8_value = /*job*/ ctx[10].todos + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*jobs*/ 4 && t12_value !== (t12_value = /*job*/ ctx[10].benefits + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*jobs*/ 4 && t16_value !== (t16_value = /*job*/ ctx[10].requirements + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*showDetails, jobs*/ 5 && tr_class_value !== (tr_class_value = /*showDetails*/ ctx[0] === /*job*/ ctx[10].id
    			? "details-row expanded"
    			: "details-row")) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(130:16) {#if showDetails === job.id}",
    		ctx
    	});

    	return block;
    }

    // (99:12) {#each jobs as job, index}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let strong;
    	let t0_value = /*job*/ ctx[10].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*job*/ ctx[10].type + "";
    	let t3;
    	let t4;
    	let td2;
    	let a;
    	let t5_value = /*job*/ ctx[10].company.shortname + "";
    	let t5;
    	let a_href_value;
    	let t6;
    	let td3;
    	let button;
    	let tr_class_value;
    	let tr_transition;
    	let t8;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*job*/ ctx[10]);
    	}

    	let if_block = /*showDetails*/ ctx[0] === /*job*/ ctx[10].id && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = text(" (m/w/d)");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			td2 = element("td");
    			a = element("a");
    			t5 = text(t5_value);
    			t6 = space();
    			td3 = element("td");
    			button = element("button");
    			button.textContent = "❯";
    			t8 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(strong, file, 104, 24, 3032);
    			set_style(td0, "padding-left", "1em");
    			add_location(td0, file, 103, 20, 2977);
    			add_location(td1, file, 108, 20, 3169);

    			attr_dev(a, "href", a_href_value = /*job*/ ctx[10].company.website
    			? /*job*/ ctx[10].company.website
    			: "#");

    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 110, 24, 3238);
    			add_location(td2, file, 109, 20, 3209);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-link pt-0 pb-0");
    			add_location(button, file, 120, 24, 3614);
    			add_location(td3, file, 119, 20, 3585);

    			attr_dev(tr, "class", tr_class_value = /*showDetails*/ ctx[0] === /*job*/ ctx[10].id
    			? "expanded"
    			: "");

    			add_location(tr, file, 99, 16, 2830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, strong);
    			append_dev(strong, t0);
    			append_dev(strong, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    			append_dev(tr, t4);
    			append_dev(tr, td2);
    			append_dev(td2, a);
    			append_dev(a, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td3);
    			append_dev(td3, button);
    			insert_dev(target, t8, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*jobs*/ 4) && t0_value !== (t0_value = /*job*/ ctx[10].title + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*jobs*/ 4) && t3_value !== (t3_value = /*job*/ ctx[10].type + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*jobs*/ 4) && t5_value !== (t5_value = /*job*/ ctx[10].company.shortname + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty & /*jobs*/ 4 && a_href_value !== (a_href_value = /*job*/ ctx[10].company.website
    			? /*job*/ ctx[10].company.website
    			: "#")) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (!current || dirty & /*showDetails, jobs*/ 5 && tr_class_value !== (tr_class_value = /*showDetails*/ ctx[0] === /*job*/ ctx[10].id
    			? "expanded"
    			: "")) {
    				attr_dev(tr, "class", tr_class_value);
    			}

    			if (/*showDetails*/ ctx[0] === /*job*/ ctx[10].id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!tr_transition) tr_transition = create_bidirectional_transition(tr, fade, {}, true);
    				tr_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!tr_transition) tr_transition = create_bidirectional_transition(tr, fade, {}, false);
    			tr_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (detaching && tr_transition) tr_transition.end();
    			if (detaching) detach_dev(t8);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(99:12) {#each jobs as job, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let main;
    	let div2;
    	let div0;
    	let label0;
    	let t3;
    	let select0;
    	let option0;
    	let t5;
    	let div1;
    	let label1;
    	let t7;
    	let select1;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let t13;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t15;
    	let th1;
    	let t17;
    	let th2;
    	let t19;
    	let th3;
    	let t20;
    	let tbody;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*companies*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*jobs*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Unternehmen";
    			t3 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Alle";

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Stellenart";
    			t7 = space();
    			select1 = element("select");
    			option1 = element("option");
    			option1.textContent = "Alle";
    			option2 = element("option");
    			option2.textContent = "Vollzeit";
    			option3 = element("option");
    			option3.textContent = "Teilzeit";
    			option4 = element("option");
    			option4.textContent = "Ausbildung";
    			option5 = element("option");
    			option5.textContent = "Minijob";
    			t13 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Bezeichnung";
    			t15 = space();
    			th1 = element("th");
    			th1.textContent = "Stellenart";
    			t17 = space();
    			th2 = element("th");
    			th2.textContent = "Unternehmen";
    			t19 = space();
    			th3 = element("th");
    			t20 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			this.c = noop;
    			attr_dev(link0, "href", "https://fonts.googleapis.com/css?family=Montserrat");
    			attr_dev(link0, "rel", "stylesheet");
    			add_location(link0, file, 44, 0, 1038);
    			attr_dev(link1, "href", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css");
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "integrity", "sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3");
    			attr_dev(link1, "crossorigin", "anonymous");
    			add_location(link1, file, 48, 0, 1130);
    			attr_dev(label0, "for", "company-select");
    			add_location(label0, file, 58, 12, 1462);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file, 65, 16, 1715);
    			attr_dev(select0, "id", "company-select");
    			attr_dev(select0, "class", "form-select");
    			if (/*filter*/ ctx[1].company === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[6].call(select0));
    			add_location(select0, file, 59, 12, 1522);
    			attr_dev(div0, "class", "col-md-4");
    			add_location(div0, file, 57, 8, 1427);
    			attr_dev(label1, "for", "type-select");
    			add_location(label1, file, 72, 12, 1971);
    			option1.__value = "";
    			option1.value = option1.__value;
    			add_location(option1, file, 79, 16, 2214);
    			option2.__value = "Vollzeit";
    			option2.value = option2.__value;
    			add_location(option2, file, 80, 16, 2261);
    			option3.__value = "Teilzeit";
    			option3.value = option3.__value;
    			add_location(option3, file, 81, 16, 2320);
    			option4.__value = "Ausbildung";
    			option4.value = option4.__value;
    			add_location(option4, file, 82, 16, 2379);
    			option5.__value = "Minijob";
    			option5.value = option5.__value;
    			add_location(option5, file, 83, 16, 2442);
    			attr_dev(select1, "id", "type-select");
    			attr_dev(select1, "class", "form-select");
    			if (/*filter*/ ctx[1].type === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[7].call(select1));
    			add_location(select1, file, 73, 12, 2027);
    			attr_dev(div1, "class", "col-md-4");
    			add_location(div1, file, 71, 8, 1936);
    			attr_dev(div2, "class", "header row justify-content-center");
    			add_location(div2, file, 56, 4, 1371);
    			add_location(th0, file, 91, 16, 2607);
    			add_location(th1, file, 92, 16, 2644);
    			add_location(th2, file, 93, 16, 2680);
    			add_location(th3, file, 94, 16, 2717);
    			add_location(tr, file, 90, 12, 2586);
    			add_location(thead, file, 89, 8, 2566);
    			add_location(tbody, file, 97, 8, 2767);
    			attr_dev(table, "class", "table");
    			add_location(table, file, 88, 4, 2536);
    			add_location(main, file, 55, 0, 1360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, link1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, select0);
    			append_dev(select0, option0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*filter*/ ctx[1].company);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, select1);
    			append_dev(select1, option1);
    			append_dev(select1, option2);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			select_option(select1, /*filter*/ ctx[1].type);
    			append_dev(main, t13);
    			append_dev(main, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t15);
    			append_dev(tr, th1);
    			append_dev(tr, t17);
    			append_dev(tr, th2);
    			append_dev(tr, t19);
    			append_dev(tr, th3);
    			append_dev(table, t20);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[6]),
    					listen_dev(select0, "change", /*filterJobs*/ ctx[4], false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[7]),
    					listen_dev(select1, "change", /*filterJobs*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*companies*/ 8) {
    				each_value_1 = /*companies*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*filter, companies*/ 10) {
    				select_option(select0, /*filter*/ ctx[1].company);
    			}

    			if (dirty & /*filter, companies*/ 10) {
    				select_option(select1, /*filter*/ ctx[1].type);
    			}

    			if (dirty & /*showDetails, jobs, toggleDetails*/ 37) {
    				each_value = /*jobs*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(link1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let data;
    	let jobs;
    	let companies;
    	let filter;
    	let showDetails;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('hand-jobs', slots, []);

    	onMount(async () => {
    		data = await http.get(`jobs`).json();
    		$$invalidate(2, jobs = data);

    		jobs.forEach(job => {
    			if (!companies.find(company => company.id === job.company.id)) {
    				$$invalidate(3, companies = [...companies, job.company]);
    			}
    		});
    	});

    	function filterJobs() {
    		$$invalidate(2, jobs = data.filter(job => {
    			if (filter.company && job.company.id != filter.company) return false;
    			if (filter.type && job.type != filter.type) return false;
    			return true;
    		}));
    	}

    	function toggleDetails(id) {
    		if (showDetails === id) {
    			$$invalidate(0, showDetails = false);
    		} else {
    			$$invalidate(0, showDetails = id);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<hand-jobs> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		filter.company = select_value(this);
    		$$invalidate(1, filter);
    		$$invalidate(3, companies);
    	}

    	function select1_change_handler() {
    		filter.type = select_value(this);
    		$$invalidate(1, filter);
    		$$invalidate(3, companies);
    	}

    	const click_handler = job => toggleDetails(job.id);

    	$$self.$capture_state = () => ({
    		onMount,
    		http,
    		fade,
    		filterJobs,
    		toggleDetails,
    		showDetails,
    		filter,
    		data,
    		jobs,
    		companies
    	});

    	$$self.$inject_state = $$props => {
    		if ('showDetails' in $$props) $$invalidate(0, showDetails = $$props.showDetails);
    		if ('filter' in $$props) $$invalidate(1, filter = $$props.filter);
    		if ('data' in $$props) data = $$props.data;
    		if ('jobs' in $$props) $$invalidate(2, jobs = $$props.jobs);
    		if ('companies' in $$props) $$invalidate(3, companies = $$props.companies);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	data = [];
    	$$invalidate(2, jobs = []);
    	$$invalidate(3, companies = []);
    	$$invalidate(1, filter = { company: "", type: "" });
    	$$invalidate(0, showDetails = false);

    	return [
    		showDetails,
    		filter,
    		jobs,
    		companies,
    		filterJobs,
    		toggleDetails,
    		select0_change_handler,
    		select1_change_handler,
    		click_handler
    	];
    }

    class Jobs extends SvelteElement {
    	constructor(options) {
    		super();
    		this.shadowRoot.innerHTML = `<style>main{font-family:"Montserrat", "Helvetica", "Arial";max-width:1000px;margin:0 auto}.header{background-color:rgba(33, 35, 34, 0.05);padding-top:1em;padding-bottom:1.5em;margin:0 0 !important;margin-bottom:2em !important}label{margin-bottom:6px;font-weight:600;font-size:0.9em;letter-spacing:1px}select{padding:0.5em 1em !important;width:80% !important;border:none !important;border-radius:10px !important}tbody,td,th,thead,tr{border-color:rgba(33, 35, 34, 0.05) !important}th{font-size:1.2em;font-weight:500;letter-spacing:1px;letter-spacing:1px}tr.expanded{background-color:rgba(33, 35, 34, 0.05)}td{padding-top:1.5em !important;padding-bottom:1.5em !important;border:none !important;letter-spacing:1px}a{font-weight:500;text-decoration:none !important;color:#b28d2f !important}a:hover{color:#9e7d29 !important}.btn-link{text-decoration:none !important;color:black !important}.details-row td{max-width:1000px;padding:0 2em !important;padding-bottom:2em !important;letter-spacing:0;line-height:1.5em;font-size:0.9em}.details-row h3{font-size:1.2em}.details-row pre{font-size:1em}</style>`;

    		init$1(
    			this,
    			{
    				target: this.shadowRoot,
    				props: attribute_to_object(this.attributes),
    				customElement: true
    			},
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{},
    			null
    		);

    		if (options) {
    			if (options.target) {
    				insert_dev(options.target, this, options.anchor);
    			}
    		}
    	}
    }

    customElements.define("hand-jobs", Jobs);

    // { target: document.getElementById("component-demo") }

    const counter = new Counter();
    const event_inquiry = new EventInquiry();
    const jobs = new Jobs({
        target: document.getElementById("component-demo"),
    });

    exports.counter = counter;
    exports.event_inquiry = event_inquiry;
    exports.jobs = jobs;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=bundle.js.map
