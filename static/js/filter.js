// Home page: focus-area cards highlight the matching projects in the work grid.
(function () {
  const buttons = document.querySelectorAll(".area");
  const notes = document.querySelectorAll(".note");
  const status = document.getElementById("filter-status");

  function apply(area, label) {
    buttons.forEach(b => b.setAttribute("aria-pressed", b.dataset.area === area));
    let shown = 0;
    notes.forEach(n => {
      const match = !area || n.dataset.areas.split(" ").includes(area);
      n.classList.toggle("dim", !match);
      if (match) shown++;
    });
    status.innerHTML = "";
    if (area) {
      status.append(`Showing ${shown} ${label} project${shown === 1 ? "" : "s"} · `);
      const clear = document.createElement("button");
      clear.textContent = "show all";
      clear.addEventListener("click", () => apply(null));
      status.append(clear);
    }
  }

  buttons.forEach(b => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") === "true";
    apply(on ? null : b.dataset.area, b.querySelector(".area-name").textContent.toLowerCase());
  }));
})();
