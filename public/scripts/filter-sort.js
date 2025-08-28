document.addEventListener("DOMContentLoaded", () => {
  const mobileFilterItems = document.querySelectorAll(".dropdown-item[data-filter]");
  const selectedFilterText = document.getElementById("selectedFilterText");

  mobileFilterItems.forEach(item => {
    item.addEventListener("click", () => {
      const selected = item.textContent;
      selectedFilterText.textContent = `Selected: ${selected}`;
    });
  });
});