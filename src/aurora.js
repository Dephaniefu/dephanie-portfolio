// Buildless WebGL2 port of React Bits Aurora (JS-CSS registry version).
const auroraContainer = document.querySelector('.aurora-container');

if (auroraContainer) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true
  });

  if (gl) {
    auroraContainer.appendChild(canvas);

    const vertexSource = `#version 300 es
      in vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fragmentSource = `#version 300 es
      precision highp float;
      uniform float uTime;
      uniform float uAmplitude;
      uniform vec3 uColorStops[3];
      uniform vec2 uResolution;
      uniform float uBlend;
      out vec4 fragColor;

      vec3 permute(vec3 x) {
        return mod(((x * 34.0) + 1.0) * x, 289.0);
      }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
          + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec3 rampColor = uv.x <= 0.5
          ? mix(uColorStops[0], uColorStops[1], uv.x * 2.0)
          : mix(uColorStops[1], uColorStops[2], (uv.x - 0.5) * 2.0);
        float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1,
          uTime * 0.25)) * 0.5 * uAmplitude;
        height = exp(height);
        height = uv.y * 2.0 - height + 0.2;
        float intensity = 0.6 * height;
        float midPoint = 0.20;
        float auroraAlpha = smoothstep(midPoint - uBlend * 0.5,
          midPoint + uBlend * 0.5, intensity);
        vec3 auroraColor = intensity * rampColor;
        fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, 'position');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      time: gl.getUniformLocation(program, 'uTime'),
      amplitude: gl.getUniformLocation(program, 'uAmplitude'),
      colors: gl.getUniformLocation(program, 'uColorStops'),
      resolution: gl.getUniformLocation(program, 'uResolution'),
      blend: gl.getUniformLocation(program, 'uBlend')
    };
    const colorStops = new Float32Array([
      0x52 / 255, 0x27 / 255, 1,
      0x96 / 255, 0x67 / 255, 1,
      0x52 / 255, 0x27 / 255, 1
    ]);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uniforms.amplitude, 1);
    gl.uniform1f(uniforms.blend, 0.5);
    gl.uniform3fv(uniforms.colors, colorStops);

    const resizeAurora = () => {
      // Aurora is deliberately rendered below native Retina resolution. The
      // soft gradient hides the difference while cutting fragment work by up
      // to ~60% on high-density displays.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(auroraContainer.clientWidth * ratio));
      const height = Math.max(1, Math.round(auroraContainer.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uniforms.resolution, width, height);
      }
    };

    let frame = 0;
    let isVisible = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const renderAurora = time => {
      frame = 0;
      gl.uniform1f(uniforms.time, time * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (isVisible && !document.hidden && !reduceMotion.matches) {
        frame = requestAnimationFrame(renderAurora);
      }
    };

    const requestRender = () => {
      if (!frame) frame = requestAnimationFrame(renderAurora);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeAurora();
      requestRender();
    });
    resizeObserver.observe(auroraContainer);
    resizeAurora();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      auroraContainer.dataset.rendering = isVisible && !document.hidden && !reduceMotion.matches ? 'active' : 'paused';
      if (isVisible) requestRender();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { rootMargin:'120px 0px', threshold:0 });
    visibilityObserver.observe(auroraContainer);

    document.addEventListener('visibilitychange', () => {
      auroraContainer.dataset.rendering = !document.hidden && isVisible && !reduceMotion.matches ? 'active' : 'paused';
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (isVisible) requestRender();
    });

    reduceMotion.addEventListener?.('change', requestRender);
    requestRender();
  }
}
