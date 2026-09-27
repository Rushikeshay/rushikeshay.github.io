// Home page atlas: a world map with a numbered pin per project,
// region "lenses" that zoom the map, and a preview card.
(async function () {
  const mapEl = document.getElementById("map");
  if (!mapEl || !window.d3) return;

  const pins = JSON.parse(document.getElementById("pins-data").textContent);
  const card = document.getElementById("card");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const W = 960;
  const sphere = { type: "Sphere" };
  const projection = d3.geoNaturalEarth1().fitWidth(W, sphere);
  const path = d3.geoPath(projection);
  const H = Math.ceil(path.bounds(sphere)[1][1]);

  // [[west, south], [east, north]] in degrees.
  const LENSES = {
    "north-america": [[-125, 24], [-66, 50]],
    "south-asia": [[67, 6], [98, 36]],
    "east-africa": [[28, -12], [48, 8]],
  };

  const svg = d3.select(mapEl).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("role", "img")
    .attr("aria-label", "World map with a pin for each project");
  const world = svg.append("g");
  world.append("path").datum(sphere).attr("class", "sphere").attr("d", path);
  world.append("path").datum(d3.geoGraticule10()).attr("class", "graticule").attr("d", path);
  const landLayer = world.append("g");
  const pinLayer = world.append("g");

  // Pins
  const pin = pinLayer.selectAll("g.pin").data(pins).join("g")
    .attr("class", "pin")
    .attr("transform", d => `translate(${projection(d.coords)})`)
    .attr("tabindex", 0)
    .attr("role", "link")
    .attr("aria-label", d => `${d.num}: ${d.title}, ${d.place}`);
  const inner = pin.append("g").attr("class", "pin-inner");
  inner.append("circle").attr("class", "halo").attr("r", 13);
  inner.append("circle").attr("class", "dot").attr("r", 12);
  inner.append("text").text(d => d.num);
  inner.append("text").attr("class", "label").attr("x", 18).text(d => d.place);

  // Land loads after pins are drawn so the map is usable immediately.
  d3.json(mapEl.dataset.world).then(topo => {
    landLayer.append("path").datum(topojson.feature(topo, topo.objects.land))
      .attr("class", "land").attr("d", path);
    landLayer.append("path").datum(topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b))
      .attr("class", "borders").attr("d", path);
  }).catch(() => { /* map still works without land shapes */ });

  // Preview card
  let active = null;
  function show(d) {
    active = d;
    pin.classed("active", p => p === d);
    document.querySelectorAll(".atlas-index a").forEach(a =>
      a.classList.toggle("active", a.dataset.slug === d.slug));
    card.href = d.url;
    card.querySelector("img").src = d.image;
    card.querySelector("img").hidden = !d.image;
    card.querySelector(".card-num").textContent = d.num;
    card.querySelector(".card-place").textContent = d.place;
    card.querySelector(".card-title").textContent = d.title;
    card.querySelector(".card-summary").textContent = d.summary;
    card.hidden = false;
    pin.filter(p => p === d).raise();
  }

  // Mouse: hover previews, click opens. Touch: first tap previews, second opens.
  let pointer = "mouse";
  pin.on("pointerdown", e => { pointer = e.pointerType; })
    .on("mouseenter", (e, d) => show(d))
    .on("focus", (e, d) => show(d))
    .on("click", (e, d) => {
      if (pointer === "mouse" || active === d) location.href = d.url;
      else show(d);
    })
    .on("keydown", (e, d) => { if (e.key === "Enter") location.href = d.url; });

  document.querySelectorAll(".atlas-index a.on-map").forEach(a => {
    const d = pins.find(p => p.slug === a.dataset.slug);
    a.addEventListener("mouseenter", () => show(d));
    a.addEventListener("focus", () => show(d));
  });

  // Lenses (region zoom)
  function zoomTo(name) {
    let k = 1, tx = 0, ty = 0;
    const box = LENSES[name];
    if (box) {
      const [[w, s], [e, n]] = box;
      const pts = [];
      for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++)
        pts.push(projection([w + (e - w) * i / 4, s + (n - s) * j / 4]));
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const [x0, x1, y0, y1] = [d3.min(xs), d3.max(xs), d3.min(ys), d3.max(ys)];
      k = Math.min(W / (x1 - x0), H / (y1 - y0)) * 0.9;
      tx = W / 2 - k * (x0 + x1) / 2;
      ty = H / 2 - k * (y0 + y1) / 2;
    }
    const t = svg.transition().duration(reduceMotion ? 0 : 900).ease(d3.easeCubicInOut);
    world.transition(t).attr("transform", `translate(${tx},${ty}) scale(${k})`);
    inner.transition(t).attr("transform", `scale(${1 / k})`);
    mapEl.classList.toggle("zoomed", k > 1);
  }

  document.querySelectorAll(".lenses button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lenses button").forEach(b => b.setAttribute("aria-pressed", b === btn));
      zoomTo(btn.dataset.lens);
    });
  });

  if (pins.length) show(pins[0]);
})();
