const header = document.getElementById("site-header");
const createButton = document.getElementById("floating-create");

function updateScrollUI() {
    const isScrolled = window.scrollY > 80;

    header.classList.toggle("shadow-sm", isScrolled);

    createButton.classList.toggle("translate-y-8", !isScrolled);
    createButton.classList.toggle("translate-y-0", isScrolled);
    createButton.classList.toggle("opacity-0", !isScrolled);
    createButton.classList.toggle("opacity-100", isScrolled);
    createButton.classList.toggle("pointer-events-none", !isScrolled);
    createButton.classList.toggle("pointer-events-auto", isScrolled);

    createButton.setAttribute("aria-hidden", String(!isScrolled));
    createButton.tabIndex = isScrolled ? 0 : -1;
}

window.addEventListener("scroll", updateScrollUI, {
    passive: true
});

updateScrollUI();