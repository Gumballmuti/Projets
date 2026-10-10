/* Fond animé du héros : dégradé fluide en WebGL qui réagit au curseur */
(function () {
  'use strict';

  var canvas = document.querySelector('.hero__gl');
  if (!canvas) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  var vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var frag = [
    'precision highp float;',
    'uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;',
    'vec3 hash(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453123);}',
    'float noise(vec3 p){vec3 i=floor(p);vec3 f=fract(p);vec3 u=f*f*(3.-2.*f);',
    'return mix(mix(mix(dot(hash(i),f),dot(hash(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(hash(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),',
    'mix(mix(dot(hash(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(hash(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}',
    'float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/r;vec2 q=uv;q.x*=r.x/r.y;',
    ' vec2 mm=m;mm.x*=r.x/r.y;',
    ' float d=distance(q,mm);',
    ' float tt=t*.07;',
    ' vec2 w=q+vec2(fbm(vec3(q*1.4,tt)),fbm(vec3(q*1.4+5.2,tt+3.)))*.9;',
    ' w+= (q-mm)*.18*exp(-d*3.);',
    ' float n=fbm(vec3(w*1.6,tt*1.4));',
    ' vec3 bg=vec3(.043,.043,.055);',
    ' vec3 c1=vec3(1.,.357,.18);',
    ' vec3 c2=vec3(.48,.36,1.);',
    ' vec3 c3=vec3(.96,.94,.92);',
    ' vec3 col=bg;',
    ' float b1=smoothstep(.0,.55,n+.18-uv.y*.25);',
    ' col=mix(col,c2*.75,b1*.85);',
    ' float b2=smoothstep(.1,.6,n+.05*sin(tt*6.)+.12*exp(-d*2.5));',
    ' col=mix(col,c1,b2*.9);',
    ' col+=c3*pow(max(n,0.),3.)*.35;',
    ' col+=c1*.18*exp(-d*4.);',
    ' float vig=smoothstep(1.25,.25,length(uv-vec2(.6,.55)));',
    ' col=mix(bg,col,vig*.95);',
    ' col*=1.-s*.6;',
    ' float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)*43758.5453);',
    ' col+= (g-.5)*.035;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }
  var vs = shader(gl.VERTEX_SHADER, vert);
  var fs = shader(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uR = gl.getUniformLocation(prog, 'r');
  var uT = gl.getUniformLocation(prog, 't');
  var uM = gl.getUniformLocation(prog, 'm');
  var uS = gl.getUniformLocation(prog, 's');

  var mouse = { x: 0.7, y: 0.6 };
  var target = { x: 0.7, y: 0.6 };
  var scrollFade = 0;
  var visible = true;
  var start = performance.now();
  var hero = canvas.parentElement;

  function resize() {
    // Rendu en résolution réduite : le flou du dégradé le permet et cela préserve la batterie
    var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
    var w = Math.max(1, Math.floor(canvas.clientWidth * scale));
    var h = Math.max(1, Math.floor(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (e) {
    var rect = canvas.getBoundingClientRect();
    target.x = (e.clientX - rect.left) / rect.width;
    target.y = 1 - (e.clientY - rect.top) / rect.height;
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) requestAnimationFrame(frame);
    }).observe(hero);
  }

  function frame(now) {
    if (!visible) return;
    resize();
    mouse.x += (target.x - mouse.x) * 0.04;
    mouse.y += (target.y - mouse.y) * 0.04;
    var rect = hero.getBoundingClientRect();
    scrollFade = Math.min(1, Math.max(0, -rect.top / rect.height));
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, reduce ? 12 : (now - start) / 1000);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.uniform1f(uS, scrollFade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(function (t) {
    frame(t);
    hero.classList.add('gl-ready');
  });
  if (reduce) window.addEventListener('resize', function () { requestAnimationFrame(frame); });
})();
