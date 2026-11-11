/**
 * Hino 300 3D Procedural Model (Esculpido Orgánico) - Transportes Fuentealba Bastida
 * Cabina lofted paramétrica con tumblehome (estrechamiento superior), frente convexo curvo,
 * parabrisas envolvente, parrilla en V con emblema Hino, faros trapezoidales curvos,
 * paso de rueda arqueado y espejos tubulares curvos (TubeGeometry).
 */
(function(window) {
  'use strict';

  function createHino300Truck3D(canvasElement, options) {
    if (!canvasElement || typeof THREE === 'undefined') return null;

    options = options || {};
    var PI = Math.PI;
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL not supported', e);
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = options.exposure || 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene();
    var fov = options.fov || 28;
    var camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 150);
    var controls = new THREE.OrbitControls(camera, canvasElement);

    var targetY = options.targetY !== undefined ? options.targetY : 1.42;
    controls.target.set(0.25, targetY, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = !!options.enablePan;
    controls.enableZoom = options.enableZoom !== undefined ? options.enableZoom : true;
    controls.minDistance = options.minDistance || 4.2;
    controls.maxDistance = options.maxDistance || 35;
    controls.maxPolarAngle = PI / 2 - 0.02;
    controls.autoRotate = options.autoRotate !== undefined ? options.autoRotate : !reduceMotion;
    controls.autoRotateSpeed = options.autoRotateSpeed || 1.25;

    function col(h) { return new THREE.Color(h).convertSRGBToLinear(); }
    function smoothstep(e0, e1, x) {
      var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    }

    /* ---------- Entorno de Estudio (PMREM) ---------- */
    (function buildEnvironment() {
      var envScene = new THREE.Scene();
      var skyGeo = new THREE.SphereGeometry(40, 36, 18);
      var p = skyGeo.attributes.position, colors = [];
      var top = col(0xd5e3f2), hor = col(0xf6f8fa), low = col(0x525860), c = new THREE.Color();
      for (var i = 0; i < p.count; i++) {
        var t = p.getY(i) / 40;
        if (t >= 0) { c.copy(hor).lerp(top, Math.pow(t, 0.55)); }
        else { c.copy(hor).lerp(low, Math.min(1, Math.pow(-t, 0.45) * 1.4)); }
        colors.push(c.r, c.g, c.b);
      }
      skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      envScene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

      var bright = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(6.2), side: THREE.DoubleSide });
      function panel(w, h, x, y, z, rx, ry) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bright);
        m.position.set(x, y, z); m.rotation.set(rx, ry, 0);
        envScene.add(m);
      }
      panel(18, 10, 0, 20, 0, PI / 2, 0);
      panel(28, 6, 0, 9, 17, 0, 0);
      panel(28, 4, 0, 4, -17, 0, 0);
      panel(10, 7, 18, 9, 0, 0, PI / 2);
      panel(10, 6, -18, 7, 0, 0, PI / 2);

      var pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(envScene, 0.03).texture;
      pm.dispose();
    })();

    /* ---------- Luces ---------- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d97a3, 0.24));
    var sun = new THREE.DirectionalLight(0xffffff, 1.42);
    sun.position.set(7, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera;
    sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 30;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    var fill = new THREE.DirectionalLight(0xeef4ff, 0.45);
    fill.position.set(-6, 5, -5);
    scene.add(fill);

    var inner = new THREE.PointLight(0xffffff, 0.65, 5);
    inner.position.set(-0.6, 2.8, 0);
    scene.add(inner);

    /* ---------- Suelo y Sombra de Contacto ---------- */
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.24 }));
    ground.rotation.x = -PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    (function contactShadow() {
      var cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      var cx = cv.getContext('2d');
      var g = cx.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, 'rgba(0,0,0,0.82)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = g;
      cx.fillRect(0, 0, 256, 256);
      var tex = new THREE.CanvasTexture(cv);
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(8.8, 3.8),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.52 })
      );
      m.rotation.x = -PI / 2;
      m.position.set(0.25, 0.012, 0);
      scene.add(m);
    })();

    /* ---------- Materiales PBR ---------- */
    function std(hex, rough, metal, extra) {
      var o = { color: col(hex), roughness: rough, metalness: metal };
      if (extra) for (var k in extra) o[k] = extra[k];
      return new THREE.MeshStandardMaterial(o);
    }
    var paint = new THREE.MeshPhysicalMaterial({
      color: col(options.initialPaintColor || '#f2f3f2'),
      roughness: 0.25, metalness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.06
    });
    var boxWallMat = new THREE.MeshPhysicalMaterial({
      color: col('#f4f5f6'),
      roughness: 0.34, metalness: 0.05, clearcoat: 0.65, clearcoatRoughness: 0.14
    });
    var aluTrim = std(0xd2d7dd, 0.35, 0.72);
    var glass = new THREE.MeshPhysicalMaterial({
      color: col(0x0c131c), roughness: 0.02, metalness: 0.22, clearcoat: 1.0,
      reflectivity: 1.0, side: THREE.DoubleSide
    });
    var frameBlack = std(0x111316, 0.65, 0.05, { side: THREE.DoubleSide });
    var plastic = std(0x1b1d21, 0.55, 0.06);
    var rubber = std(0x141518, 0.92, 0, { side: THREE.DoubleSide });
    var chrome = std(0xeef2f6, 0.08, 1.0);
    var rimMat = std(0xd4d9df, 0.32, 0.85, { side: THREE.DoubleSide });
    var darkSteel = std(0x363b42, 0.52, 0.6);
    var lampLens = std(0xf6f9fc, 0.06, 0.2, { emissive: col(0xfff4d6), emissiveIntensity: 0.25 });
    var amber = std(0xff9100, 0.25, 0, { emissive: col(0xff7700), emissiveIntensity: 0.5 });
    var redLens = std(0xc91e1e, 0.22, 0, { emissive: col(0xc41212), emissiveIntensity: 0.45 });
    var lampMats = [
      { m: lampLens, off: 0.25, on: 2.6 },
      { m: amber, off: 0.5, on: 2.2 },
      { m: redLens, off: 0.45, on: 2.4 }
    ];
    var liner = std(0xdadddf, 0.85, 0, { envMapIntensity: 0.3 });
    var floorMat = std(0x888f96, 0.8, 0.12, { envMapIntensity: 0.3 });
    var cardboard = std(0xb58d54, 0.88, 0, { envMapIntensity: 0.35 });
    var seamMat = std(0x22272d, 0.8, 0);
    var white = std(0xf2f2f2, 0.45, 0);
    var redTape = std(0xb8161e, 0.45, 0);

    var truck = new THREE.Group();
    scene.add(truck);

    /* ---------- Helpers de Geometría ---------- */
    function place(mesh, x, y, z, parent, shadow) {
      mesh.position.set(x, y, z);
      if (shadow !== false) { mesh.castShadow = true; mesh.receiveShadow = true; }
      (parent || truck).add(mesh);
      return mesh;
    }
    function box(w, h, d, mat, x, y, z, parent, shadow) {
      return place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z, parent, shadow);
    }
    function cyl(r, len, mat, x, y, z, axis, parent, shadow) {
      var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 20), mat);
      if (axis === 'x') m.rotation.z = PI / 2;
      if (axis === 'z') m.rotation.x = PI / 2;
      return place(m, x, y, z, parent, shadow);
    }
    function rrShape(w, h, r) {
      var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    function rbox(w, h, d, r, mat, x, y, z, parent, shadow) {
      var iw = Math.max(w - 2 * r, 0.004), ih = Math.max(h - 2 * r, 0.004), id = Math.max(d - 2 * r, 0.004);
      var g = new THREE.ExtrudeGeometry(rrShape(iw, ih, Math.min(r * 0.65, iw / 2, ih / 2)), {
        depth: id, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 5
      });
      g.translate(0, 0, -id / 2);
      return place(new THREE.Mesh(g, mat), x, y, z, parent, shadow);
    }

    /* ---------- Funciones Matemáticas de la Cabina Orgánica Hino 300 ---------- */
    // Semiancho orgánico (Tumblehome: más ancha en cintura y puertas, se estrecha arriba en techo)
    function cabHalfWidth(y) {
      var u = Math.max(0, Math.min(1, (y - 1.38) / (2.36 - 1.38)));
      var lowDoor = 1.005 + 0.02 * Math.sin(smoothstep(0.65, 1.45, y) * PI);
      return lowDoor - 0.145 * Math.pow(u, 1.25);
    }

    // Curvatura frontal convexa (en el centro X sobresale suavemente y retrocede hacia las esquinas A)
    function frontConvexOffset(zNorm) {
      return 0.095 * (1 - zNorm * zNorm);
    }

    // Contorno lateral suave del perfil Hino 300 (Curva continua desde techo -> parabrisas -> trompa -> arco rueda)
    function buildCabProfilePoints() {
      var raw = [
        [1.42, 0.68],   // Parte trasera inferior detrás del paso rueda
        [1.40, 1.15],
        [1.40, 1.85],
        [1.43, 2.24],
        [1.52, 2.34],   // Esquina techo trasero curvada
        [2.05, 2.36],
        [2.52, 2.34],   // Curva frente del techo
        [2.68, 2.26],   // Tope parabrisas
        [2.87, 1.88],   // Centro parabrisas inclinado
        [3.05, 1.50],   // Base parabrisas / inicio capó
        [3.13, 1.34],   // Nariz redondeada Hino
        [3.17, 1.10],   // Zona parrilla / faros
        [3.16, 0.88],   // Sobre parachoques delantero
        [2.94, 0.87],   // Borde delantero paso de rueda
        [2.81, 0.87],
        [2.64, 0.98],   // Subida arco de rueda
        [2.36, 1.04],   // Cúspide arco de rueda (R~0.59 sobre eje 2.35, 0.445)
        [2.06, 0.97],   // Bajada trasera arco de rueda
        [1.86, 0.72],   // Escalón trasero de puerta
        [1.72, 0.66],   // Base estribo
        [1.46, 0.66]    // Cierre trasero inferior
      ];
      var curve = new THREE.SplineCurve(raw.map(function(p) { return new THREE.Vector2(p[0], p[1]); }));
      // Curva cerrada suavizada con alta resolución
      var pts = curve.getPoints(96);
      return pts;
    }

    // Construir malla paramétrica "Lofted" de la cabina Hino 300 (sin cantos cuadrados!)
    (function buildSculptedCab() {
      var profilePts = buildCabProfilePoints();
      var M = profilePts.length; // puntos alrededor del perfil
      var cx = 2.28, cy = 1.52;

      // Niveles de la sección en Z (de -1 a +1) con redondeo suave en esquinas
      var zStops = [-1.0, -0.992, -0.97, -0.92, -0.82, -0.60, -0.30, 0.0, 0.30, 0.60, 0.82, 0.92, 0.97, 0.992, 1.0];
      var N = zStops.length;

      var positions = [];
      var indices = [];

      function evalCabPoint(px, py, zNorm) {
        var absZ = Math.abs(zNorm);
        // Radio/bisel de bordes laterales al acercarse a |zNorm| -> 1
        var bevel = 0;
        if (absZ > 0.82) {
          var bt = (absZ - 0.82) / 0.18; // 0..1
          bevel = 0.065 * (1 - Math.sqrt(Math.max(0, 1 - bt * bt)));
        }

        // Dirección hacia el centro del perfil para encoger suavemente en los cantos
        var dx = px - cx, dy = py - cy;
        var dlen = Math.hypot(dx, dy) || 1;
        var sx = px - (dx / dlen) * bevel;
        var sy = py - (dy / dlen) * bevel * 0.85;

        // Curvatura convexa del frente (solo actúa en la cara delantera x > 2.2)
        var frontMask = smoothstep(2.25, 2.95, px);
        sx += frontConvexOffset(zNorm) * frontMask;

        // Ligero bombeo del techo arriba
        var topMask = smoothstep(2.15, 2.36, py);
        sy += 0.032 * (1 - zNorm * zNorm) * topMask;

        // Semiancho con tumblehome
        var hw = cabHalfWidth(sy);
        // Ligero abombamiento orgánico en el panel de la puerta lateral
        var doorOut = (absZ > 0.95) ? 0.015 * Math.sin(smoothstep(0.75, 1.50, sy) * PI) : 0;
        var sz = zNorm * (hw + doorOut);

        return [sx, sy, sz];
      }

      // 1. Generar anillos de la carrocería lofted
      for (var i = 0; i < N; i++) {
        var zN = zStops[i];
        for (var j = 0; j < M; j++) {
          var p = profilePts[j];
          var v = evalCabPoint(p.x, p.y, zN);
          positions.push(v[0], v[1], v[2]);
        }
      }

      for (var i = 0; i < N - 1; i++) {
        for (var j = 0; j < M - 1; j++) {
          var a = i * M + j;
          var b = (i + 1) * M + j;
          var c = (i + 1) * M + (j + 1);
          var d = i * M + (j + 1);
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      // 2. Tapas laterales sólidas usando ShapeGeometry proyectado a la superficie curva (soporta arco cóncavo sin fallos)
      var sideShape = new THREE.Shape(profilePts);
      var baseSideGeo = new THREE.ShapeGeometry(sideShape);
      var basePos = baseSideGeo.attributes.position;
      var baseIdx = baseSideGeo.index;

      [1, -1].forEach(function (side) {
        var offset = positions.length / 3;
        for (var k = 0; k < basePos.count; k++) {
          var px = basePos.getX(k);
          var py = basePos.getY(k);
          var v = evalCabPoint(px, py, side * 1.0);
          // Ligero abombamiento orgánico en el centro de la puerta
          var distCenter = Math.hypot((px - cx) / 0.85, (py - cy) / 0.85);
          var bulge = Math.max(0, 1 - distCenter * distCenter) * 0.018;
          v[2] += side * bulge;
          positions.push(v[0], v[1], v[2]);
        }
        // Determinar orientación real de la cara de ShapeGeometry (normal en +Z)
        for (var t = 0; t < baseIdx.count; t += 3) {
          var i0 = offset + baseIdx.getX(t);
          var i1 = offset + baseIdx.getX(t + 1);
          var i2 = offset + baseIdx.getX(t + 2);
          if (side === 1) {
            indices.push(i0, i1, i2);
          } else {
            indices.push(i0, i2, i1);
          }
        }
      });

      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      // DoubleSide garantiza solidez total sin cortes en tapas laterales y usa `paint` directamente para soportar cambio de color
      paint.side = THREE.DoubleSide;
      var mesh = new THREE.Mesh(geo, paint);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      truck.add(mesh);
    })();

    /* ---------- Parabrisas Panorámico Curvo con Esquinas Redondeadas y Limpiaparabrisas Tándem ---------- */
    (function buildCurvedWindshield() {
      function makeRoundedCurvedWindshield(wFrac, yBot, yTop, xBot, xTop, cornerR, offset, mat) {
        // Creamos Shape en espacio normalizado (u in [-1,1], v in [0,1]) con esquinas redondeadas reales
        var w = 2.0, h = 1.0, r = cornerR;
        var sh = new THREE.Shape();
        sh.moveTo(-1 + r, 0);
        sh.lineTo(1 - r, 0);
        sh.quadraticCurveTo(1, 0, 1, r);
        sh.lineTo(1, 1 - r);
        sh.quadraticCurveTo(1, 1, 1 - r, 1);
        sh.lineTo(-1 + r, 1);
        sh.quadraticCurveTo(-1, 1, -1, 1 - r);
        sh.lineTo(-1, r);
        sh.quadraticCurveTo(-1, 0, -1 + r, 0);

        // Subdividimos en malla para curvarlo suavemente en Z y X
        var g = new THREE.ShapeGeometry(sh, 18);
        // También añadimos subdivisiones internas usando PlaneGeometry si fuera necesario, o mapeamos directo
        // Mejor: generamos grilla densa 28x14 y recortamos/curvamos esquinas suavemente!
        g.dispose();

        var nu = 28, nv = 14;
        var pos = [], idx = [];
        for (var iv = 0; iv <= nv; iv++) {
          var v = iv / nv; // 0..1
          for (var iu = 0; iu <= nu; iu++) {
            var u = (iu / nu) * 2 - 1; // -1..1
            // Suavizado superelíptico de esquinas para marco orgánico (como foto frontal)
            var vClamped = v;
            var uClamped = u;
            // Ligero estrechamiento/redondeo de esquinas en los extremos
            var cornerDistU = Math.max(0, Math.abs(u) - (1 - cornerR));
            var cornerDistV = (v < cornerR) ? (cornerR - v) : (v > 1 - cornerR ? v - (1 - cornerR) : 0);
            if (cornerDistU > 0 && cornerDistV > 0) {
              var ang = Math.atan2(cornerDistV, cornerDistU);
              var rad = Math.min(cornerR, Math.hypot(cornerDistU, cornerDistV));
              uClamped = Math.sign(u) * ((1 - cornerR) + Math.cos(ang) * rad * 0.85);
              vClamped = (v < 0.5) ? (cornerR - Math.sin(ang) * rad * 0.85) : ((1 - cornerR) + Math.sin(ang) * rad * 0.85);
            }
            var py = yBot + (yTop - yBot) * vClamped;
            var pxBase = xBot + (xTop - xBot) * vClamped;
            var hw = cabHalfWidth(py) * wFrac;
            var pz = uClamped * hw;
            var px = pxBase + frontConvexOffset(uClamped * wFrac) + offset;
            pos.push(px, py, pz);
          }
        }
        for (var iv = 0; iv < nv; iv++) {
          for (var iu = 0; iu < nu; iu++) {
            var a = iv * (nu + 1) + iu;
            var b = a + 1;
            var c = a + (nu + 1);
            var d = c + 1;
            idx.push(a, c, b);
            idx.push(b, c, d);
          }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        var m = new THREE.Mesh(geo, mat);
        truck.add(m);
        return m;
      }

      // Marco de goma negra envolvente con esquinas curvas
      makeRoundedCurvedWindshield(0.905, 1.54, 2.23, 3.04, 2.705, 0.14, 0.011, frameBlack);
      // Vidrio panorámico reflectivo
      makeRoundedCurvedWindshield(0.865, 1.57, 2.19, 3.028, 2.725, 0.12, 0.016, glass);

      // Limpiaparabrisas tándem articulados 3D (idénticos a la foto frontal de referencia!)
      [
        { zPivot: -0.14, lenArm: 0.24, lenBlade: 0.42, tilt: 0.16 },
        { zPivot: 0.46, lenArm: 0.26, lenBlade: 0.44, tilt: 0.14 }
      ].forEach(function (wp) {
        var slopeAng = Math.atan2(0.32, 0.67);
        var pxBase = 3.005 + frontConvexOffset(wp.zPivot / 0.90) + 0.025;
        var pyBase = 1.60;
        var g = new THREE.Group();
        g.position.set(pxBase, pyBase, wp.zPivot);
        g.rotation.z = slopeAng;
        truck.add(g);

        // Cubo pivote + brazo metálico ahusado + escobilla de goma curva
        cyl(0.016, 0.025, plastic, 0, 0, 0, 'x', g, false);
        var armPts = [
          new THREE.Vector3(0.006, 0, 0),
          new THREE.Vector3(0.010, wp.lenArm * Math.sin(wp.tilt), -wp.lenArm * Math.cos(wp.tilt)),
          new THREE.Vector3(0.008, (wp.lenArm + wp.lenBlade) * Math.sin(wp.tilt * 0.85), -(wp.lenArm + wp.lenBlade) * Math.cos(wp.tilt * 0.85))
        ];
        var armTube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(armPts), 14, 0.007, 6, false), plastic);
        g.add(armTube);
      });
    })();

    /* ---------- Frontal Esculpido Hino 300: Líneas Orgánicas, Careta en Ala y Parrilla Curva ---------- */
    (function buildHinoFrontDetails() {
      // Helper para crear tiras curvas que abrazan exactamente la curvatura frontal del frente (sin cajas planas!)
      function makeCurvedFrontRibbon(zHalf, yBot, yTop, depthOut, mat) {
        var nu = 20;
        var pos = [], idx = [];
        for (var iu = 0; iu <= nu; iu++) {
          var u = (iu / nu) * 2 - 1; // -1..1
          var pz = u * zHalf;
          // Interpolamos la posición X del morro curvo según Y
          var xB = 3.165 + frontConvexOffset(pz / 1.0) + depthOut;
          var xT = 3.145 + frontConvexOffset(pz / 1.0) + depthOut;
          pos.push(xB, yBot, pz);
          pos.push(xT, yTop, pz);
        }
        for (var iu = 0; iu < nu; iu++) {
          var a = iu * 2;
          var b = a + 1;
          var c = a + 2;
          var d = a + 3;
          idx.push(a, c, b);
          idx.push(b, c, d);
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        var m = new THREE.Mesh(geo, mat);
        truck.add(m);
        return m;
      }

      // 1. Líneas cóncavas curvas del capó (desde las esquinas inferiores del parabrisas hasta la parrilla/faros)
      [1, -1].forEach(function (s) {
        var pts = [
          new THREE.Vector3(3.04 + frontConvexOffset(0.84) + 0.012, 1.53, s * 0.81),
          new THREE.Vector3(3.12 + frontConvexOffset(0.62) + 0.015, 1.37, s * 0.60),
          new THREE.Vector3(3.165 + frontConvexOffset(0.45) + 0.016, 1.24, s * 0.44),
          new THREE.Vector3(3.175 + frontConvexOffset(0.39) + 0.016, 0.97, s * 0.38)
        ];
        var curve = new THREE.CatmullRomCurve3(pts);
        truck.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.0055, 6, false), seamMat));
      });

      // 2. Línea superior curva en forma de "ala de gaviota" (gull-wing) que cruza sobre la parrilla y rodea el emblema
      var browPts = [];
      for (var i = -12; i <= 12; i++) {
        var t = i / 12; // -1..1
        var pz = t * 0.46;
        // Se curva suavemente hacia arriba en el centro para acoger al emblema Hino
        var archY = 1.225 + 0.048 * Math.exp(-(t * t) / 0.08);
        var px = 3.155 + frontConvexOffset(pz / 1.0) + 0.018;
        browPts.push(new THREE.Vector3(px, archY, pz));
      }
      truck.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(browPts), 24, 0.006, 6, false), seamMat));

      // 3. Dos finas ranuras oscuras curvas de ventilación (idénticas a la foto frontal, sin bloque negro cuadrado!)
      makeCurvedFrontRibbon(0.41, 1.105, 1.135, 0.022, frameBlack);  // Ranura superior fina
      makeCurvedFrontRibbon(0.38, 1.000, 1.028, 0.024, frameBlack);  // Ranura inferior fina

      // Pequeñas crestas / nervios horizontales pintados entre las ranuras (relieve curvo orgánico)
      makeCurvedFrontRibbon(0.43, 1.142, 1.185, 0.028, paint);
      makeCurvedFrontRibbon(0.40, 1.035, 1.098, 0.028, paint);

      // 4. Emblema Circular HINO Esculpido Integrado en el Arco Superior
      var embGroup = new THREE.Group();
      embGroup.position.set(3.175 + frontConvexOffset(0) + 0.025, 1.225, 0);
      embGroup.rotation.z = Math.atan2(0.05, 0.35);
      truck.add(embGroup);

      // Anillo cromado ovalado/circular suave
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.014, 12, 32), chrome);
      ring.scale.set(1.12, 0.94, 1);
      ring.rotation.y = PI / 2;
      embGroup.add(ring);

      // Interior oscuro sutil + barra horizontal cromada prominente (igual a foto frontal!)
      var badgeBg = new THREE.Mesh(new THREE.CircleGeometry(0.082, 24), darkSteel);
      badgeBg.scale.set(1.10, 0.90, 1);
      badgeBg.rotation.y = PI / 2;
      badgeBg.position.x = -0.005;
      embGroup.add(badgeBg);
      rbox(0.022, 0.028, 0.145, 0.008, chrome, 0.006, 0, 0, embGroup, false);
    })();

    /* ---------- Faros Delanteros Esculpidos Hino 300 (Triangulares Diagonales + Proyector Esférico) ---------- */
    [1, -1].forEach(function (s) {
      var hl = new THREE.Group();
      // Colocados en las esquinas inferiores flanqueando las líneas en V
      hl.position.set(3.165 + frontConvexOffset(0.66), 1.105, s * 0.67);
      hl.rotation.z = Math.atan2(0.06, 0.35);
      hl.rotation.y = -s * 0.30; // Se envuelve limpiamente alrededor de la esquina del guardabarros!
      truck.add(hl);

      // Forma exacta del faro Hino 300: borde interior diagonal (/ \) que baja hacia el centro, ceja superior curva
      function hinoLampShape(scale) {
        var sc = scale || 1.0;
        var sh = new THREE.Shape();
        if (s > 0) {
          // Z positivo (+Z = izq en vista X)
          sh.moveTo(-0.20 * sc, -0.115 * sc);   // Esquina inf exterior
          sh.lineTo(0.14 * sc, -0.105 * sc);    // Esquina inf interior (inclinada)
          sh.lineTo(0.22 * sc, 0.075 * sc);     // Esquina sup interior (diagonal /)
          sh.quadraticCurveTo(0.12 * sc, 0.115 * sc, -0.18 * sc, 0.145 * sc); // Ceja superior suave
          sh.quadraticCurveTo(-0.21 * sc, 0.140 * sc, -0.21 * sc, -0.10 * sc);
        } else {
          // Espejo en Z negativo
          sh.moveTo(-0.14 * sc, -0.105 * sc);
          sh.lineTo(0.20 * sc, -0.115 * sc);
          sh.quadraticCurveTo(0.21 * sc, 0.140 * sc, 0.18 * sc, 0.145 * sc);
          sh.quadraticCurveTo(-0.12 * sc, 0.115 * sc, -0.22 * sc, 0.075 * sc);
          sh.lineTo(-0.14 * sc, -0.105 * sc);
        }
        sh.closePath();
        return sh;
      }

      var hlHousingMat = std(0x6e7885, 0.25, 0.85);
      var hlGlassMat = new THREE.MeshPhysicalMaterial({
        color: col(0xe6eef8), roughness: 0.04, metalness: 0.1, clearcoat: 1.0,
        transparent: true, opacity: 0.38
      });

      // Marco sutil esculpido en gris oscuro / cromo (sin recuadro negro plano feo)
      var bezelGeo = new THREE.ExtrudeGeometry(hinoLampShape(1.02), { depth: 0.032, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 });
      var bezelMesh = new THREE.Mesh(bezelGeo, seamMat);
      bezelMesh.rotation.y = PI / 2; bezelMesh.position.x = 0.002;
      hl.add(bezelMesh);

      // Fondo reflector parabólico plateado/cromado
      var cupGeo = new THREE.ExtrudeGeometry(hinoLampShape(0.92), { depth: 0.025, bevelEnabled: false });
      var cupMesh = new THREE.Mesh(cupGeo, hlHousingMat);
      cupMesh.rotation.y = PI / 2; cupMesh.position.x = 0.020;
      hl.add(cupMesh);

      // Barra divisoria diagonal interior del reflector (igual a foto frontal!)
      var rib = box(0.018, 0.22, 0.028, chrome, 0.038, -0.01, s * 0.07, hl, false);
      rib.rotation.x = s * 0.28;

      // Ceja superior / intermitente ámbar integrado bajo la pestaña del capó
      var eyebrow = box(0.02, 0.038, 0.16, amber, 0.042, 0.088, s * 0.02, hl, false);
      eyebrow.rotation.x = -s * 0.08;

      // Proyector esférico prominente de lupa (SphereGeometry en el centro del faro!)
      var projCup = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 0.025, 24), chrome);
      projCup.rotation.z = PI / 2;
      place(projCup, 0.036, -0.015, -s * 0.025, hl, false);
      var projDome = new THREE.Mesh(new THREE.SphereGeometry(0.048, 20, 14), lampLens);
      place(projDome, 0.044, -0.015, -s * 0.025, hl, false);

      // Lente cristal curva protectora
      var lensGeo = new THREE.ExtrudeGeometry(hinoLampShape(0.94), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 2 });
      var lensMesh = new THREE.Mesh(lensGeo, hlGlassMat);
      lensMesh.rotation.y = PI / 2; lensMesh.position.x = 0.052;
      hl.add(lensMesh);
    });

    /* ---------- Parachoques Delantero Esculpido con Tomas de Aire Empotradas y Neblineros ---------- */
    (function buildCurvedBumper() {
      var by = 0.705;
      var path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.96, by, -1.00),
        new THREE.Vector3(3.16, by, -0.89),
        new THREE.Vector3(3.27, by, -0.45),
        new THREE.Vector3(3.30, by, 0),
        new THREE.Vector3(3.27, by, 0.45),
        new THREE.Vector3(3.16, by, 0.89),
        new THREE.Vector3(2.96, by, 1.00)
      ]);
      var bShape = rrShape(0.30, 0.34, 0.068);
      var bGeo = new THREE.ExtrudeGeometry(bShape, {
        steps: 32,
        bevelEnabled: false,
        extrudePath: path
      });
      var bumperMat = new THREE.MeshPhysicalMaterial({
        color: col(0x23272e), roughness: 0.42, metalness: 0.08, clearcoat: 0.4, clearcoatRoughness: 0.25
      });
      var bMesh = new THREE.Mesh(bGeo, bumperMat);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      truck.add(bMesh);

      [1, -1].forEach(function (s) {
        rbox(0.28, 0.33, 0.06, 0.05, bumperMat, 2.96, by, s * 1.00);

        // 1. Tomas de aire inferiores trapezoidales con marco biselado, fondo hundido y aletas interiores (sobre cara frontal real del parachoques)
        var intakeG = new THREE.Group();
        intakeG.position.set(3.455, by - 0.01, s * 0.43);
        intakeG.rotation.y = -s * 0.06;
        truck.add(intakeG);

        // Labio exterior biselado alrededor de la toma
        rbox(0.025, 0.13, 0.38, 0.022, darkSteel, 0, 0, 0, intakeG, false);
        // Fondo oscuro profundo de la toma
        rbox(0.028, 0.10, 0.34, 0.018, frameBlack, 0.004, 0, 0, intakeG, false);
        // Detalle interno: tabique vertical y tapa de gancho de remolque (como se aprecia en foto frontal!)
        box(0.028, 0.095, 0.022, darkSteel, 0.012, 0, s * 0.04, intakeG, false);
        rbox(0.028, 0.065, 0.075, 0.01, darkSteel, 0.011, 0, -s * 0.09, intakeG, false);

        // 2. Copas hundidas de neblineros en las esquinas redondeadas del parachoques
        var fogG = new THREE.Group();
        fogG.position.set(3.35, by - 0.01, s * 0.85);
        fogG.rotation.y = -s * 0.34;
        truck.add(fogG);
        var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.046, 0.035, 22), darkSteel);
        cup.rotation.z = PI / 2;
        fogG.add(cup);
        var fLens = new THREE.Mesh(new THREE.SphereGeometry(0.036, 16, 12), lampLens);
        fLens.position.x = 0.008;
        fogG.add(fLens);
      });

      // Estampado central limpio de placa patente (al ras del parachoques, con borde sutil)
      rbox(0.022, 0.135, 0.34, 0.012, darkSteel, 3.462, by - 0.015, 0, truck, false);
      rbox(0.022, 0.120, 0.32, 0.010, white, 3.468, by - 0.015, 0, truck, false);
    })();

    /* ---------- Ventanas Laterales Inclinadas + Paso de Rueda + Espejos Curvos (TubeGeometry) ---------- */
    [1, -1].forEach(function (s) {
      // Construir ventana lateral en 3D adaptándose a la pendiente/tumblehome exacta cabHalfWidth(y)
      function addSideWindowPoly(pts, mat, zExtra) {
        var pos = [];
        var idx = [];
        // Triangulación simple usando ShapeGeometry y proyectando su Z a cabHalfWidth(y)!
        var sh = new THREE.Shape();
        pts.forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); });
        sh.closePath();
        var g = new THREE.ShapeGeometry(sh, 8);
        var pAttr = g.attributes.position;
        for (var i = 0; i < pAttr.count; i++) {
          var wx = pAttr.getX(i);
          var wy = pAttr.getY(i);
          var wz = s * (cabHalfWidth(wy) + 0.015 + zExtra);
          pAttr.setZ(i, wz);
        }
        g.computeVertexNormals();
        var m = new THREE.Mesh(g, mat);
        truck.add(m);
        return m;
      }

      // Ventana característica de Hino 300 (sigue línea de techo y pilar A curvo + rebaje frontal)
      var winFramePts = [[1.88, 1.50], [2.42, 1.50], [2.56, 1.41], [2.95, 1.44], [2.72, 2.20], [1.88, 2.20]];
      var winGlassPts = [[1.93, 1.54], [2.41, 1.54], [2.55, 1.45], [2.90, 1.48], [2.69, 2.15], [1.93, 2.15]];
      addSideWindowPoly(winFramePts, frameBlack, 0.002);
      addSideWindowPoly(winGlassPts, glass, 0.005);

      // Línea vertical de puerta trasera y manilla empotrada
      box(0.01, 1.32, 0.01, seamMat, 1.84, 1.58, s * 0.995, truck, false);
      rbox(0.16, 0.042, 0.032, 0.012, plastic, 1.98, 1.32, s * 1.008, truck, false);

      // Moldura protectora negra alrededor del arco de rueda delantero
      var lip = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.028, 8, 32, PI * 0.92), paint);
      lip.rotation.z = 0.12;
      place(lip, 2.35, 0.45, s * 0.985);

      // Guardabarros / faldón interno rueda delantera (detrás de la rueda)
      box(0.025, 0.28, 0.34, rubber, 1.76, 0.36, s * 0.94);

      // Luz lateral naranja sutil
      box(0.025, 0.042, 0.10, amber, 1.62, 0.98, s * 0.998, truck, false);
    });

    // Espejo Lateral Principal (Lado izquierdo del camión = -Z, que aparece a la derecha en la foto frontal!)
    [1, -1].forEach(function (s) {
      if (s === -1) {
        // Lado conductor/izquierdo: brazo largo curvo en S estilo Hino con gancho superior (exacto a foto frontal y lateral!)
        var armCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.86, 1.45, -0.96),
          new THREE.Vector3(2.89, 1.50, -1.16),
          new THREE.Vector3(2.89, 1.66, -1.25),
          new THREE.Vector3(2.88, 2.08, -1.26),
          new THREE.Vector3(2.86, 2.24, -1.20),
          new THREE.Vector3(2.74, 2.24, -0.94)
        ]);
        truck.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 30, 0.011, 8, false), plastic));

        // Carcasa aerodinámica curva del espejo (elipsoide limpio sin alas laterales!)
        var mhGeo = new THREE.SphereGeometry(0.14, 18, 14);
        mhGeo.scale(0.32, 1.55, 0.52);
        var mhMesh = new THREE.Mesh(mhGeo, paint);
        place(mhMesh, 2.88, 1.94, -1.27, truck, true);
        // Cara oscura de luna trasera vertical
        var mfGeo = new THREE.SphereGeometry(0.125, 16, 12);
        mfGeo.scale(0.14, 1.42, 0.44);
        var mfMesh = new THREE.Mesh(mfGeo, chrome);
        place(mfMesh, 2.845, 1.94, -1.27, truck, false);

        // Pequeño brazo y espejo auxiliar redondo en la esquina inferior de la puerta
        var spotBracket = new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.76, 1.50, -0.96),
          new THREE.Vector3(2.74, 1.44, -1.07)
        ]);
        truck.add(new THREE.Mesh(new THREE.TubeGeometry(spotBracket, 8, 0.008, 6, false), plastic));
        var spotCup = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), plastic);
        spotCup.scale.set(0.65, 1.0, 0.85);
        place(spotCup, 2.74, 1.42, -1.09, truck, false);
      } else {
        // Lado derecho (+Z): espejo auxiliar compacto en la esquina delantera de la ventana (idéntico a Foto 3!)
        var rBracket = new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.78, 1.50, 0.96),
          new THREE.Vector3(2.76, 1.43, 1.07)
        ]);
        truck.add(new THREE.Mesh(new THREE.TubeGeometry(rBracket, 8, 0.008, 6, false), plastic));
        var rSpot = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), plastic);
        rSpot.scale.set(0.65, 1.05, 0.85);
        place(rSpot, 2.76, 1.41, 1.09, truck, false);
      }
    });

    /* ---------- CHASIS Y BAJOS (Fiel a las vistas laterales 2 y 3) ---------- */
    box(5.2, 0.15, 0.88, plastic, 0.15, 0.78, 0);                          // Largueros chasis
    box(0.08, 0.15, 2.04, darkSteel, -2.68, 0.68, 0);                      // Defensa trasera bajo cola furgón
    [-0.9, -0.72, -0.54, -0.36, -0.18, 0, 0.18, 0.36, 0.54, 0.72, 0.9].forEach(function (z, i) {
      box(0.015, 0.10, 0.16, i % 2 ? white : redTape, -2.725, 0.68, z, truck, false);
    });
    // Estanque y caja de baterías bajo el costado derecho/izquierdo del chasis (exacto a foto 2 y 3!)
    cyl(0.20, 0.72, darkSteel, 0.42, 0.62, 0.68, 'x');                     // Estanque combustible
    rbox(0.50, 0.32, 0.36, 0.03, plastic, 1.05, 0.64, 0.68);               // Caja baterías frontal
    cyl(0.14, 0.58, darkSteel, 0.65, 0.62, -0.64, 'x');                    // Tanque de aire opuesto
    rbox(0.46, 0.30, 0.34, 0.03, plastic, 1.10, 0.64, -0.66);

    // Cardán inclinado hacia el diferencial trasero (visible en foto lateral!)
    var cardan = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 2.35, 14), darkSteel);
    cardan.rotation.z = PI / 2 - 0.11;
    place(cardan, 0.45, 0.57, 0, truck, false);
    var diff = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), darkSteel);
    place(diff, -0.75, 0.45, 0);

    /* ---------- RUEDAS (6 orificios + doble rueda trasera + faldón inclinado) ---------- */
    var R = 0.445;
    function tireGeo(w) {
      var h = w / 2, pts = [
        [0.255, -h], [0.35, -h], [0.40, -h + 0.008], [0.43, -h + 0.03], [R, -h + 0.055],
        [R, h - 0.055], [0.43, h - 0.03], [0.40, h - 0.008], [0.35, h], [0.255, h]
      ].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      return new THREE.LatheGeometry(pts, 48);
    }
    function makeWheel(w, side) {
      var g = new THREE.Group(), h = w / 2, i, a;
      var tire = new THREE.Mesh(tireGeo(w), rubber);
      tire.castShadow = true;
      g.add(tire);
      var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, w + 0.01, 32, 1, true), rimMat);
      g.add(barrel);
      var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.252, 0.252, 0.02, 32), rimMat);
      disc.position.y = side * (h - 0.04);
      g.add(disc);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 8, 32), rimMat);
      ring.rotation.x = PI / 2; ring.position.y = side * (h + 0.002);
      g.add(ring);
      var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.055, 20), chrome);
      hub.position.y = side * (h - 0.012);
      g.add(hub);
      var faceY = side * (h - 0.032);
      for (i = 0; i < 6; i++) {
        a = i / 6 * PI * 2;
        var nut = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.025, 6), darkSteel);
        nut.position.set(Math.cos(a) * 0.135, side * (h - 0.025), Math.sin(a) * 0.135);
        g.add(nut);
      }
      for (i = 0; i < 6; i++) {
        a = i / 6 * PI * 2 + 0.52;
        var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.006, 12), frameBlack);
        hole.position.set(Math.cos(a) * 0.195, faceY + side * 0.01, Math.sin(a) * 0.195);
        g.add(hole);
      }
      g.rotation.x = PI / 2;
      return g;
    }
    function addWheel(x, z, w, side) {
      var wh = makeWheel(w, side);
      wh.position.set(x, R, z);
      truck.add(wh);
    }
    [1, -1].forEach(function (s) {
      addWheel(2.35, s * 0.94, 0.27, s);
      addWheel(-0.75, s * 0.70, 0.24, s);
      addWheel(-0.75, s * 0.96, 0.24, s);
      // Guardabarros trasero curvo que rodea parte superior-trasera
      var mg = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.68, 24, 1, true, PI * 0.72, PI * 0.78), rubber);
      mg.rotation.x = PI / 2;
      place(mg, -0.75, R, s * 0.83);
      box(0.025, 0.36, 0.5, rubber, -1.26, 0.45, s * 0.96);
    });
    [2.35, -0.75].forEach(function (x) { cyl(0.065, 1.98, darkSteel, x, R, 0, 'z', truck, false); });

    /* ---------- FURGÓN / CAJA DE CARGA (Limpio y Fiel a Foto 1, 2 y 3) ---------- */
    var bx0 = -2.72, bx1 = 1.24, bw = 2.18, by0 = 0.94, bh = 2.24, t = 0.055;
    var bxc = (bx0 + bx1) / 2, blen = bx1 - bx0, byc = by0 + bh / 2, btop = by0 + bh;
    box(blen, 0.075, bw, floorMat, bxc, by0 + 0.038, 0);
    box(blen, t, bw, boxWallMat, bxc, btop - t / 2, 0);
    box(blen, bh, t, boxWallMat, bxc, byc, bw / 2 - t / 2);
    box(blen, bh, t, boxWallMat, bxc, byc, -bw / 2 + t / 2);
    box(t, bh, bw, boxWallMat, bx1 - t / 2, byc, 0);

    // Forros interiores
    box(blen - 0.1, bh - 0.2, 0.01, liner, bxc, byc + 0.04, bw / 2 - t - 0.005, truck, false);
    box(blen - 0.1, bh - 0.2, 0.01, liner, bxc, byc + 0.04, -bw / 2 + t + 0.005, truck, false);
    box(blen - 0.1, 0.01, bw - 0.2, liner, bxc, btop - t - 0.005, 0, truck, false);
    box(0.01, bh - 0.2, bw - 0.2, liner, bx1 - t - 0.005, byc + 0.04, 0, truck, false);

    // Carga interior (sin sombra proyectada hacia afuera para evitar artefactos en pared delgada)
    box(0.85, 0.85, 0.9, cardboard, 0.65, 1.44, -0.52, truck, false);
    box(0.78, 0.65, 0.82, cardboard, 0.68, 1.35, 0.5, truck, false);
    box(0.55, 0.50, 0.55, cardboard, -0.15, 1.27, -0.55, truck, false);

    // Molduras perimetrales metálicas y esquineros con topes de techo
    [1, -1].forEach(function (s) {
      box(blen + 0.04, 0.08, 0.032, aluTrim, bxc, by0 + 0.04, s * (bw / 2 + 0.01), truck, false);
      box(blen + 0.04, 0.085, 0.035, aluTrim, bxc, btop - 0.038, s * (bw / 2 + 0.012), truck, false);
      cyl(0.038, bh + 0.03, aluTrim, bx1, byc, s * (bw / 2), 'y');
      cyl(0.038, blen + 0.04, aluTrim, bxc, btop, s * (bw / 2), 'x');
      // Pequeñas luces de gálibo en los esquineros superiores (como en foto 1)
      box(0.055, 0.055, 0.08, amber, bx1 + 0.01, btop + 0.01, s * (bw / 2 - 0.02), truck, false);
      box(0.055, 0.055, 0.08, redLens, bx0 - 0.01, btop + 0.01, s * (bw / 2 - 0.02), truck, false);
    });
    cyl(0.038, bw + 0.04, aluTrim, bx1, btop, 0, 'z');
    cyl(0.038, bw + 0.04, aluTrim, bx0, btop, 0, 'z');

    // Puertas traseras articuladas con bisagras (táctiles!)
    function makeDoor(side) {
      var pivot = new THREE.Group();
      pivot.position.set(bx0, 2.06, side * (bw / 2));
      box(t, 2.10, 1.075, boxWallMat, -t / 2, 0, -side * 0.5375, pivot);
      box(0.015, 1.88, 0.045, aluTrim, -t - 0.006, 0, -side * 0.28, pivot, false);
      box(0.015, 1.88, 0.045, aluTrim, -t - 0.006, 0, -side * 0.78, pivot, false);
      cyl(0.013, 1.94, chrome, -t - 0.028, 0, -side * 0.96, 'y', pivot, false);
      box(0.045, 0.15, 0.028, darkSteel, -t - 0.042, 0, -side * 0.96, pivot, false);
      rbox(0.04, 0.28, 0.10, 0.01, redLens, -t - 0.012, -0.82, -side * 0.14, pivot, false);
      [-0.74, 0, 0.74].forEach(function (y) { cyl(0.026, 0.18, darkSteel, -t / 2, y, 0, 'y', pivot, false); });
      truck.add(pivot);
      return pivot;
    }
    var doorP = makeDoor(1);
    var doorN = makeDoor(-1);

    /* ---------- Cámara y Vistas ---------- */
    var scaleFactor = options.scaleFactor || 1.0;
    var views = {
      front: [9.5 * scaleFactor, 2.2 * scaleFactor, 0.001],
      side: [0.001, 2.4 * scaleFactor, 10.5 * scaleFactor],
      rear: [-10.5 * scaleFactor, 2.6 * scaleFactor, 0.001],
      top: [0.001, 13.5 * scaleFactor, 0.001],
      start: [(options.startX || 8.0) * scaleFactor, (options.startY || 3.4) * scaleFactor, (options.startZ || 8.0) * scaleFactor]
    };

    var tween = null;
    function fit() {
      var w = canvasElement.clientWidth || 300;
      var h = canvasElement.clientHeight || 300;
      var a = w / Math.max(h, 1);
      return Math.max(1, Math.pow(1.25 / a, 0.7));
    }

    function goTo(name, instant) {
      var v = views[name] || views.start;
      var k = fit();
      var end = new THREE.Vector3(v[0] * k, v[1] * (name === 'top' ? k : Math.max(1, k * 0.8)), v[2] * k);
      if (instant) {
        camera.position.copy(end);
        controls.update();
        return;
      }
      tween = { from: camera.position.clone(), to: end, t0: performance.now(), dur: 750 };
    }
    function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    controls.addEventListener('start', function () { tween = null; });

    /* ---------- Estados y Controles Públicos ---------- */
    var doorTarget = options.initialDoorOpen ? 1 : 0;
    var door = doorTarget;
    var lightsOn = false;

    function setDoor(target) {
      doorTarget = target ? 1 : 0;
      return doorTarget;
    }
    function toggleDoor() {
      return setDoor(!doorTarget);
    }
    function setLights(on) {
      lightsOn = !!on;
      lampMats.forEach(function (l) { l.m.emissiveIntensity = lightsOn ? l.on : l.off; });
      return lightsOn;
    }
    function toggleLights() {
      return setLights(!lightsOn);
    }
    function setSpin(on) {
      controls.autoRotate = !!on;
      return controls.autoRotate;
    }
    function setColor(hex) {
      paint.color.copy(col(hex));
    }

    /* ---------- Detección Táctil y Clic en Puertas Traseras ---------- */
    var downPos = null;
    var raycaster = new THREE.Raycaster();
    var pointer = new THREE.Vector2();

    function getPointerNDC(event) {
      var rect = canvasElement.getBoundingClientRect();
      var clientX = event.clientX;
      var clientY = event.clientY;
      if (event.touches && event.touches.length) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches.length) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      }
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1
      };
    }

    function checkDoorIntersection(ndc) {
      pointer.set(ndc.x, ndc.y);
      raycaster.setFromCamera(pointer, camera);
      var hits = raycaster.intersectObjects([doorP, doorN], true);
      if (hits.length > 0) return true;
      var allHits = raycaster.intersectObjects(truck.children, true);
      for (var i = 0; i < allHits.length; i++) {
        var pt = allHits[i].point;
        if (pt.x < -2.35 && pt.y > 0.8 && pt.y < 3.3 && Math.abs(pt.z) < 1.25) {
          return true;
        }
      }
      return false;
    }

    canvasElement.addEventListener('pointerdown', function(e) {
      downPos = { x: e.clientX, y: e.clientY, time: performance.now() };
    });

    canvasElement.addEventListener('pointermove', function(e) {
      if (!downPos) {
        var ndc = getPointerNDC(e);
        if (checkDoorIntersection(ndc)) {
          canvasElement.style.cursor = 'pointer';
          canvasElement.title = 'Toca las puertas para abrir o cerrar';
        } else {
          canvasElement.style.cursor = 'grab';
          canvasElement.title = '';
        }
      }
    });

    canvasElement.addEventListener('pointerup', function(e) {
      if (!downPos) return;
      var dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      var elapsed = performance.now() - downPos.time;
      downPos = null;
      if (dist < 12 && elapsed < 450) {
        var ndc = getPointerNDC(e);
        if (checkDoorIntersection(ndc)) {
          toggleDoor();
        }
      }
    });

    /* ---------- Tamaño y ResizeObserver ---------- */
    function resize() {
      var parent = canvasElement.parentElement || canvasElement;
      var w = parent.clientWidth || canvasElement.clientWidth;
      var h = parent.clientHeight || canvasElement.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(canvasElement.parentElement || canvasElement);
    }
    window.addEventListener('resize', resize);
    resize();
    goTo('start', true);

    /* ---------- Bucle de Animación ---------- */
    var last = performance.now();
    var isRunning = true;
    function frame(now) {
      if (!isRunning) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      door += (doorTarget - door) * (1 - Math.exp(-6 * dt));
      doorP.rotation.y = 1.75 * door;
      doorN.rotation.y = -1.75 * door;

      if (tween) {
        var p = Math.min((now - tween.t0) / tween.dur, 1);
        camera.position.lerpVectors(tween.from, tween.to, ease(p));
        if (p >= 1) tween = null;
      }
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      renderer: renderer,
      scene: scene,
      camera: camera,
      controls: controls,
      truck: truck,
      paintMaterial: paint,
      goTo: goTo,
      setDoor: setDoor,
      toggleDoor: toggleDoor,
      setLights: setLights,
      toggleLights: toggleLights,
      setSpin: setSpin,
      setColor: setColor,
      resize: resize,
      destroy: function() {
        isRunning = false;
        if (ro) ro.disconnect();
        window.removeEventListener('resize', resize);
        renderer.dispose();
      }
    };
  }

  window.createHino300Truck3D = createHino300Truck3D;
})(window);
