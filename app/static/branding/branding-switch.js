(()=> {
  "use strict";
  const variants = {
    base: "/branding/roguedashboard.svg",
    dark: "/branding/roguedashboard-dark.svg",
    light: "/branding/roguedashboard-light.svg",
  };

  function preferredVariant() {
    const explicit = localStorage.getItem("rgdash-brand-variant");
    if (explicit && variants[explicit]) return explicit;
    if (document.querySelector(".theme-light")) return "light";
    return "dark";
  }

  function apply() {
    const variant = preferredVariant();
    const source = variants[variant];
    document.documentElement.dataset.rgdBrand = variant;
    document.querySelectorAll("[data-rgd-brand-image]").forEach(img => {
      if (img.getAttribute("src") !== source) img.setAttribute("src", source);
    });
    const favicon = document.querySelector('link[data-rgd-brand-icon]');
    if (favicon && favicon.getAttribute("href") !== source) favicon.setAttribute("href", source);
  }

  document.addEventListener("DOMContentLoaded", apply);
  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});
})();