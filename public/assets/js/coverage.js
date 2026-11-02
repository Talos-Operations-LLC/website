// Coverage data is maintained in /assets/data/coverage.json.
// County geometry is pre-projected Albers USA TopoJSON.
(async function initCoverage() {
  try {
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
      throw new Error('Map libraries did not load');
    }
    const [CONFIG, topology] = await Promise.all([
      '/assets/data/coverage.json',
      '/assets/data/county-map.json',
    ].map(async url => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
      return response.json();
    }));

    // ---- derived counts (single source of truth: CONFIG.counties) ----
    const entries = Object.entries(CONFIG.counties);
    const liveCount = entries.filter(([,c]) => c.status === "live").length;
    const surveyedCount = entries.filter(([,c]) => c.status === "surveyed").length;

    document.getElementById("counts").innerHTML =
      `<span class="live">[${liveCount} live]</span><span class="surveyed">[${surveyedCount} surveyed]</span>`;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- map ----
    const svg = d3.select("#map");
    const svgNode = svg.node();
    // The geometry is pre-projected into a 975 x 610 frame.
    const BASE_W = 975, BASE_H = 610;
    // On desktop the page sizes the map's box, so the viewBox takes the box's
    // own proportions (nation centred) and North Carolina fills the box instead
    // of being letterboxed. On phones the box keeps the frame's proportions.
    const desktop = window.matchMedia("(min-width: 901px)");
    let width = BASE_W, height = BASE_H, originX = 0, originY = 0;
    // The view starts on North Carolina and keeps following it through
    // resizes until the visitor moves the map themselves.
    let pinnedToNC = true;

    const g = svg.append("g");
    const path = d3.geoPath(); // topology is pre-projected (Albers USA)

    const counties = topojson.feature(topology, topology.objects.counties).features;
    const tooltip = document.getElementById("tooltip");
    const mapWrap = document.querySelector(".map-wrap");

    g.append("path")
      .datum(topojson.feature(topology, topology.objects.nation))
      .attr("class", "nation-fill")
      .attr("d", path);

    g.selectAll("path.county")
      .data(counties)
      .join("path")
      .attr("class", d => {
        const c = CONFIG.counties[d.id];
        return "county" + (c ? " " + c.status : "");
      })
      .attr("d", path)
      .on("mousemove", (event, d) => {
        const c = CONFIG.counties[d.id];
        const rect = mapWrap.getBoundingClientRect();
        tooltip.style.display = "block";
        let x = event.clientX - rect.left + 14;
        let y = event.clientY - rect.top + 14;
        if (x > rect.width - 260) x -= 280;
        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
        tooltip.innerHTML = `<div class="t-name">${d.properties.name} County</div>` +
          (c
            ? (c.status === "live"
                ? `<div class="t-status live">[live · since ${c.since}]</div>`
                : `<div class="t-status">[surveyed]</div>`)
            : `<div class="t-status">[not yet covered]</div>`);
      })
      .on("mouseleave", () => { tooltip.style.display = "none"; });

    g.append("path")
      .datum(topojson.mesh(topology, topology.objects.states, (a, b) => a !== b))
      .attr("class", "state-line")
      .attr("d", path);

    g.append("path")
      .datum(topojson.feature(topology, topology.objects.nation))
      .attr("class", "nation-line")
      .attr("d", path);

    const zoom = d3.zoom()
      .scaleExtent([1, 30])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        g.selectAll(".county").attr("stroke-width", 0.3 / event.transform.k * 1.4 + 0.08);
        g.select(".state-line").attr("stroke-width", 0.7 / Math.sqrt(event.transform.k));
        g.select(".nation-line").attr("stroke-width", 0.8 / Math.sqrt(event.transform.k));
        if (event.sourceEvent) pinnedToNC = false;
      });
    svg.call(zoom);

    function sizeViewBox() {
      const rect = svgNode.getBoundingClientRect();
      if (!desktop.matches || !rect.width || !rect.height) {
        width = BASE_W; height = BASE_H; originX = 0; originY = 0;
      } else if (rect.width / rect.height >= BASE_W / BASE_H) {
        height = BASE_H; width = BASE_H * rect.width / rect.height;
        originX = (BASE_W - width) / 2; originY = 0;
      } else {
        width = BASE_W; height = BASE_W * rect.height / rect.width;
        originX = 0; originY = (BASE_H - height) / 2;
      }
      svg.attr("viewBox", `${originX} ${originY} ${width} ${height}`);
      zoom.translateExtent([[originX, originY], [originX + width, originY + height]]);
    }

    const ncCounties = counties.filter(d => d.id.startsWith("37"));
    function fitBounds(features, scalePad) {
      const b = features.map(path.bounds).reduce((acc, bb) => [
        [Math.min(acc[0][0], bb[0][0]), Math.min(acc[0][1], bb[0][1])],
        [Math.max(acc[1][0], bb[1][0]), Math.max(acc[1][1], bb[1][1])],
      ]);
      const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
      const k = Math.min(30, scalePad / Math.max(dx / width, dy / height));
      return d3.zoomIdentity.translate(originX + width / 2 - k * cx, originY + height / 2 - k * cy).scale(k);
    }

    // Web fonts change the headline's height, and with it the map's box, so
    // the first fit waits for them.
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
    sizeViewBox();
    const ncTransform = fitBounds(ncCounties, 0.85);
    if (reduceMotion) {
      svg.call(zoom.transform, ncTransform);
    } else {
      svg.transition().delay(500).duration(1600).call(zoom.transform, ncTransform);
    }

    function refit() {
      sizeViewBox();
      if (!pinnedToNC) return;
      const t = fitBounds(ncCounties, 0.85);
      if (reduceMotion) svg.call(zoom.transform, t);
      else svg.transition().duration(400).call(zoom.transform, t);
    }
    if (typeof ResizeObserver !== "undefined") {
      let settled = false; // the observer reports the current size once on attach
      new ResizeObserver(() => { if (settled) refit(); settled = true; }).observe(svgNode);
    } else {
      addEventListener("resize", refit);
    }

    document.getElementById("zoom-in").onclick = () => { pinnedToNC = false; svg.transition().duration(300).call(zoom.scaleBy, 1.6); };
    document.getElementById("zoom-out").onclick = () => { pinnedToNC = false; svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.6); };
    document.getElementById("zoom-reset").onclick = () => { pinnedToNC = false; svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); };

  } catch (error) {
    console.error('Coverage map failed to load:', error);
    document.getElementById('counts').textContent =
      'The coverage map could not load. Please refresh the page.';
    document.querySelector('.map-wrap').hidden = true;
  }
})();
