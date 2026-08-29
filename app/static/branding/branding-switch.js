(()=> {
  "use strict";
  const variants = {
    base: "/icons/roguedashboard-approved-128.png?v=1.4.0-r2",
    dark: "/icons/roguedashboard-approved-128.png?v=1.4.0-r2",
    light: "/icons/roguedashboard-approved-128.png?v=1.4.0-r2",
  };

  function preferredVariant() {
    const explicit = localStorage.getItem("rgdash-brand-variant");
    return explicit && variants[explicit] ? explicit : "base";
  }

  function apply() {
    const variant = preferredVariant();
    const source = variants[variant];
    document.documentElement.dataset.rgdBrand = variant;
    document.querySelectorAll("[data-rgd-brand-image]").forEach(img => {
      if (img.getAttribute("src") !== source) img.setAttribute("src", source);
    });
  }

  document.addEventListener("DOMContentLoaded", apply);
  new MutationObserver(apply).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class"]
  });
})();
