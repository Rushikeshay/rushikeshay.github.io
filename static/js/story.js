// Project pages: reading-progress bar and a small locator globe.
(function () {
  const bar = document.getElementById("progress");
  if (bar) {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  const el = document.getElementById("locator");
  if (!el || !window.d3) return;
  const lon = +el.dataset.lon, lat = +el.dataset.lat;
  const S = 200;
  const projection = d3.geoOrthographic().scale(S / 2 - 2).translate([S / 2, S / 2]).clipAngle(90);
  const path = d3.geoPath(projection);
  const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${S} ${S}`).attr("aria-hidden", true);

  const sphere = svg.append("path").datum({ type: "Sphere" }).attr("class", "sphere");
  const grat = svg.append("path").datum(d3.geoGraticule10()).attr("class", "graticule");
  const land = svg.append("path").attr("class", "land");
  const ring = svg.append("circle").attr("class", "ring").attr("r", 14);
  const here = svg.append("circle").attr("class", "here").attr("r", 5);

  function draw(rotation) {
    projection.rotate(rotation);
    sphere.attr("d", path);
    grat.attr("d", path);
    land.attr("d", path);
    const [x, y] = projection([lon, lat]);
    ring.attr("cx", x).attr("cy", y);
    here.attr("cx", x).attr("cy", y);
  }

  const target = [-lon, -lat * 0.85];
  d3.json(el.dataset.world).then(topo => {
    land.datum(topojson.feature(topo, topo.objects.land));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return draw(target);
    const spin = d3.interpolate([target[0] + 140, target[1] + 15], target);
    const t = d3.timer(elapsed => {
      const p = d3.easeCubicOut(Math.min(1, elapsed / 1600));
      draw(spin(p));
      if (p === 1) t.stop();
    });
  }).catch(() => draw(target));
  draw(target);
})();
