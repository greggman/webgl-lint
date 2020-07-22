# WebGL Lint

<img src="./webgl-lint.png" style="max-width: 640px">

WebGL lint is a script you can throw into your WebGL project
to check for common WebGL errors.

* Calls `getError` after every function and throws if there was an error.

* Checks that no arguments to any functions are `undefined`. 

  Pass `0` or `false` or `null` where you mean `0` or `false` or `null`.

* Checks that no numbers or values in arrays of numbers are `NaN`. 

* Checks that all non-sampler uniforms are set. (see configuration below)

* If there is a WebGL error it tries to provide more info about why

  * for framebuffer feedback it will tell you which texture assigned to which uniform and which attachment
  
  * access out of range issues, it will tell you which attribute

  * for other errors it will try print extra info where possible.

## Example

Open the JavaScript console. You'll see first example prints fewer errors and less info
where as the second prints much more info.

* [without script](https://greggman.github.io/webgl-lint/test/errors-without-webgl-lint.html)
* [with script](https://greggman.github.io/webgl-lint/test/errors-with-webgl-lint.html)

# Usage

```
<script src="https://greggman.github.io/webgl-lint/webgl-lint.js"></script>
```

or 

```
import 'https://greggman.github.io/webgl-lint/webgl-lint.js';
```

WebGL Lint `throw`s a JavaScript exception when there is an issue so if you are
using `try`/`catch` to catch errors you might need to print the exceptions
inside your catch block. You can also turn on "pause on exception" on your
JavaScript debugger.

Throwing seemed more a appropriate than just printing an error because if you
get an error you should fix it! I tried the script out with all the
[three.js examples](https://threejs.org/examples). It found 1 real bug and several half bugs.
By half bugs I mean there were several examples that functioned but were actually
passing `NaN` or `null` in the wrong places for a few frames or they were not setting
uniforms that probably should have been set. Arguably it's
better to fix those so that you can continue to use the helper to find real
errors. In any case most of examples ran without error so you can do it
too! 😉

### `GMAN_debug_helper` extension

WebGL Lint adds a special extension `GMAN_debug_helper` with 3 functions

* `tagObject(obj: WebGLObject, name: string): void` - see naming below
* `getTagForObject(obj: WebGLObject): string` - see naming below
* `setConfiguration(settings): void` - see configuration below

### Configuration

You don't need to configure anything to use in general but there are some settings
for special needs.

* `maxDrawCalls` (default: 1000)

  Turns off the checking after this many draw calls. Set to -1 to check forever.

* `failUnsetUniforms`: (default: true)

  Checks that you set uniforms except for samplers and fails if you didn't.
  It's a common error to forget to set a uniform or to mis-spell the name of
  a uniform and therefore not set the real one. The common exception is
  samplers because uniforms default to 0 so not setting a sampler means use
  texture unit 0 so samplers are not checked.
  
  Of course maybe you're not initializing some uniforms on purpose
  so you can turn off this check. I'd recommend setting them so you get the
  benefit of this check finding errors.

  Note: uniform blocks are not checked directly. They are checked by WebGL itself
  in the sense that if you fail to provide uniform buffers for your uniform blocks
  you'll get an error but there is no easy way to check that you set them.

* `failUnsetSamplerUniforms`: (default: false)

  See above why sampler uniforms are on checked by default. You can force them
  to be checked by this setting.

* `failZeroMatrixUniforms`: (default: true)

  Checks that a uniform matrix not all zeros. It's a common source of errors to
  forget to set a matrix to the identity and it seems uncommon to have an all
  zero matrix. If you have a reason a matrix needs to be all zeros you may want
  to turn this off. 

* `ignoreUniforms`: (default: [])

  Lets out configure certain uniforms not to be checked. This why you can turn
  off checking or certain uniforms if they don't above the rules above and still
  keep the rules on for other uniforms. This configuration is additive. In other words

  ```js
  ext.setConfiguration({ignoreUniforms: ['foo', 'bar']});
  ext.setConfiguration({ignoreUniforms: ['baz']});
  ```

  Ignores uniforms called 'foo', 'bar', and 'baz'.

* `throwOnError`: (default: true)

  The default is to throw an exception on error. This has several benefits.

  1. It encourages you to fix the bug.

  2. You'll get a stack trace which you can drill down to find the bug.

  3. If you use "pause on exception" in your browser's dev tools you'll
     get a live stack trace where you can explore all the local variables
     and state of your program.

  But, there might be times when you can't avoid the error, say you're
  running a 3rd party library that gets errors. You should go politely
  ask them to fix the bug or better, fix yourself and send them a pull request.
  In any case, if you just want it to print an error instead of throw then
  you can set `throwOnError` to false.

There 2 ways to configure

1.  Via the extension and JavaScript.

    Example:

    ```js
    const gl = someCanvas.getContext('webgl');
    const ext = gl.getExtension('GMAN_debug_helper');
    if (ext) {
      ext.setConfiguration({
        maxDrawCalls: 2000,
        failUnsetUniformSamplers: true,
      });
    }
    ```

2. Via an HTML dataset attribute

   Example:

   ```html
   <script
     src="https://github.greggman.io/webgl-helpers/webgl-gl-error-check.js"
     data-gman-webgl-helper='
       {
         "maxDrawCalls": 2000, 
         "failUnsetUniformSamplers": true
       }
     '>
   </script>
   ```

   Note: (1) the setting string must be valid JSON. (2) any tag will do, `<div>`, `<span>`, etc. as the
   script just applies all tags it finds with `querySelector('[data-gman-webgl-helper]')` and applies
   the options in the order found.

### Naming your WebGL objects (buffers, textures, programs, etc..)

Using the extension you can name your objects. This way when an error is printed
the names will be inserted where appropriate.

```js
const ext = gl.getExtension('GMAN_debug_helper');
const tex = gl.createTexture();
ext.tagObject(tex, 'background-tex');
```

Now if you get an error related to `tex` you might get an told it's related to 'background-tex'
instead of just that you got an error.

4 suggestions for using naming

1.  make some helpers

    ```js
    const ext = gl.getExtension('GMAN_debug_helper');
    const tagObject = ext ? ext.tagObject.bind(ext) : () => ();
    ```

    now you can just unconditionally tag things and if the extension does
    not exist it will just be a no-op.

    ```js
    const tex = gl.createTexture();
    tagObject(tex, 'checkerboard');
    ```
  
2.  wrap the creations functions

    ```js
    const ext = gl.getExtension('GMAN_debug_helper');
    if (ext) {
      Object.keys(gl.__proto__)
        .filter(name => name.startsWith('create'))
        .forEach(name => {
          const origFn = gl[name];
          if (origFn) {
            gl[name] = function(...args) {
              const obj = origFn.call(this, ...args);
              if (obj) {
                ext.tagObject(obj, args[args.length - 1] || '*unknown*');
              }
              return obj;
            }
          }
        });
    }
    ```

    Which you use like this

    ```js
    const shader = gl.createShader(gl.VERTEX_SHADER, 'phongVertexShader');
    const tex = gl.createTexture('tree-texture');
    ```

    and they'll still work in normal WebGL as it will ignore
    the extra parameter.

3. Same as above but not wrapped

    ```js
    const ext = gl.getExtension('GMAN_debug_helper');
    const api = Object.fromEntries(
        Object.keys(gl.__proto__)
          .filter(name => name.startsWith('create'))
          .map(name => {
            const func = (ext && gl[name])
              ? function(...args) {
                  const obj = gl[name](...args);
                  if (obj) {
                    ext.tagObject(obj, args[args.length - 1] || '*unknown*');
                  }
                  return obj;
                }
              : function(...args) {
                  return gl[name](...args);
                };
            return [name, func];
          }));
    ```

    Which you use like this

    ```js
    const shader = api.createShader(gl.VERTEX_SHADER, 'phongVertexShader');
    const tex = api.createTexture('tree-texture');
    ```

    If you're allergic to hacking native APIs this is better but you have to
    remember to use `api.createXXX` instead of `gl.createXXX`

4.  Use your own API.

    Lots of people have wrapped WebGL themselves with things like `class Texture` and
    `class Framebuffer` or other functions. Those would be a good place to integrate
    tagging.

As a simple example, naming buffers after the attributes they'll
be used with (eg. 'position', 'normal'), naming textures by the URL of the img where they
get their data. Naming vertex array objects by the model ('tree', 'car', 'house'), naming
framebuffers by their usage ('shadow-depth', 'post-processing'), naming programs by what they do ('phong-shading', 'skybox')...

Just for symmetry the extension also includes `getTagForObject` if you want to look up
what string you tagged an object with

```js
const buf = gl.createBuffer();
ext.tagObject(buf, 'normals');
console.log(ext.getTagForObject(buf));  // prints 'normals'
```


