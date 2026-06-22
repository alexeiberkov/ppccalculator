const modelSelect = document.getElementById("model-select");
const pricingSonnet = document.getElementById("pricing-sonnet");
const pricingHybrid = document.getElementById("pricing-hybrid");

function updatePricingTable() {
  const isHybrid = modelSelect.value === "sonnet-4-5-haiku-4-5";

  pricingSonnet.hidden = isHybrid;
  pricingHybrid.hidden = !isHybrid;
}

modelSelect.addEventListener("change", updatePricingTable);
updatePricingTable();
