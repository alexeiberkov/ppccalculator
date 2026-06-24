const MODEL_NAMES = {
  "sonnet-4-5": "Sonnet 4.5",
  "haiku-4-5": "Haiku 4.5",
};

const PRICING = {
  "sonnet-4-5": {
    inputCost: "0.000003000",
    inputCaching: "0.000003750",
    outputCost: "0.000015000",
    outputCaching: "0.000000300",
  },
  "haiku-4-5": {
    inputCost: "0.000001000",
    inputCaching: "0.00000125",
    outputCost: "0.000005000",
    outputCaching: "0.000000100",
  },
};

const invoicesDay = document.getElementById("invoices-day");
const workingDays = document.getElementById("working-days");
const documentSizeTokens = document.getElementById("document-size-tokens");
const soTokensPerGroup = document.getElementById("so-tokens-per-group");
const promptSizeTokens = document.getElementById("prompt-size-tokens");
const thinkingBudgetPerPrompt = document.getElementById(
  "thinking-budget-per-prompt"
);
const mandatorySoOutputTokensPerField = document.getElementById(
  "mandatory-so-output-tokens-per-field"
);
const optionalSoOutputTokensPerField = document.getElementById(
  "optional-so-output-tokens-per-field"
);
const mandatoryGroupingFactor = document.getElementById(
  "mandatory-grouping-factor"
);
const optionalGroupingFactor = document.getElementById(
  "optional-grouping-factor"
);
const mandatoryModel = document.getElementById("mandatory-model");
const optionalModel = document.getElementById("optional-model");
const mandatoryFields = document.getElementById("mandatory-fields");
const optionalFields = document.getElementById("optional-fields");
const mandatoryEstimatedOcrCost = document.getElementById(
  "mandatory-estimated-ocr-cost"
);
const optionalEstimatedOcrCost = document.getElementById(
  "optional-estimated-ocr-cost"
);

function updateColumnVisibility() {
  const mandatory = Number(mandatoryFields.value) || 0;
  const optional = Number(optionalFields.value) || 0;

  document.querySelectorAll('[data-column="mandatory"]').forEach((cell) => {
    cell.hidden = mandatory === 0;
  });

  document.querySelectorAll('[data-column="optional"]').forEach((cell) => {
    cell.hidden = optional === 0;
  });
}

function updateModelTableHeaders(tableId, headerAttr) {
  const models = {
    mandatory: mandatoryModel.value,
    optional: optionalModel.value,
  };

  document
    .querySelectorAll(`#${tableId} [${headerAttr}]`)
    .forEach((cell) => {
      cell.textContent = MODEL_NAMES[models[cell.dataset.column]];
    });
}

function updatePricingTable() {
  const models = {
    mandatory: mandatoryModel.value,
    optional: optionalModel.value,
  };

  updateModelTableHeaders("pricing-table", "data-pricing-header");

  document
    .querySelectorAll("#pricing-table [data-pricing]")
    .forEach((cell) => {
      const column = cell.dataset.column;
      const key = cell.dataset.pricing;
      cell.textContent = formatCost(Number(PRICING[models[column]][key]));
    });
}

function getFieldCount(column) {
  return column === "mandatory"
    ? Number(mandatoryFields.value) || 0
    : Number(optionalFields.value) || 0;
}

function columnReceivesDocumentSize(column) {
  const mandatory = Number(mandatoryFields.value) || 0;
  const optional = Number(optionalFields.value) || 0;
  if (mandatory > 0) return column === "mandatory";
  if (optional > 0) return column === "optional";
  return false;
}

function getOcrCostForColumn(column) {
  const mandatory = Number(mandatoryFields.value) || 0;
  const optional = Number(optionalFields.value) || 0;
  const mandatoryOcr = Number(mandatoryEstimatedOcrCost.value) || 0;
  const optionalOcr = Number(optionalEstimatedOcrCost.value) || 0;

  if (mandatory === 0 && optional === 0) return 0;
  if (mandatory > 0 && optional > 0) {
    return column === "mandatory" ? mandatoryOcr : 0;
  }
  if (column === "mandatory" && mandatory > 0) return mandatoryOcr;
  if (column === "optional" && optional > 0) return optionalOcr;
  return 0;
}

function calcGroups(fieldsCount, factor) {
  const factorNum = Number(factor) || 0;
  if (factorNum === 0) return 0;
  return Math.ceil((Number(fieldsCount) || 0) / factorNum);
}

function getColumnGroups() {
  const mandatory = Number(mandatoryFields.value) || 0;
  const optional = Number(optionalFields.value) || 0;

  return {
    mandatory: calcGroups(mandatory, mandatoryGroupingFactor.value),
    optional: calcGroups(optional, optionalGroupingFactor.value),
    mandatoryFields: mandatory,
    optionalFields: optional,
  };
}

function updateInputTokensTable() {
  const { mandatory, optional, mandatoryFields: mFields, optionalFields: oFields } =
    getColumnGroups();

  updateModelTableHeaders("input-tokens-table", "data-input-tokens-header");

  const soPerGroup = Number(soTokensPerGroup.value) || 0;
  const documentSize = Number(documentSizeTokens.value) || 0;

  const mandatorySoTotal = mFields > 0 ? soPerGroup * mandatory : 0;
  const optionalSoTotal = oFields > 0 ? soPerGroup * optional : 0;
  const mandatoryDocSize =
    mFields > 0 && columnReceivesDocumentSize("mandatory") ? documentSize : 0;
  const optionalDocSize =
    oFields > 0 && columnReceivesDocumentSize("optional") ? documentSize : 0;

  document.querySelector('[data-groups="mandatory"]').textContent =
    mFields > 0 ? mandatory : 0;
  document.querySelector('[data-groups="optional"]').textContent =
    oFields > 0 ? optional : 0;
  document.querySelector('[data-so-total="mandatory"]').textContent =
    mandatorySoTotal;
  document.querySelector('[data-so-total="optional"]').textContent =
    optionalSoTotal;
  document.querySelector('[data-total-tokens="mandatory"]').textContent =
    mandatorySoTotal + mandatoryDocSize;
  document.querySelector('[data-total-tokens="optional"]').textContent =
    optionalSoTotal + optionalDocSize;
}

function updateOutputTokensTable() {
  const { mandatory, optional, mandatoryFields: mFields, optionalFields: oFields } =
    getColumnGroups();

  updateModelTableHeaders("output-tokens-table", "data-output-tokens-header");

  const thinkingPerPrompt = Number(thinkingBudgetPerPrompt.value) || 0;
  const mandatorySoOutputPerField =
    Number(mandatorySoOutputTokensPerField.value) || 0;
  const optionalSoOutputPerField =
    Number(optionalSoOutputTokensPerField.value) || 0;
  const mandatoryGrouping = Number(mandatoryGroupingFactor.value) || 0;
  const optionalGrouping = Number(optionalGroupingFactor.value) || 0;

  const mandatoryThinkingTotal =
    mFields > 0 ? thinkingPerPrompt * mandatory : 0;
  const optionalThinkingTotal =
    oFields > 0 ? thinkingPerPrompt * optional : 0;
  const mandatorySoOutputTotal =
    mFields > 0 ? mandatorySoOutputPerField * mandatoryGrouping * mandatory : 0;
  const optionalSoOutputTotal =
    oFields > 0 ? optionalSoOutputPerField * optionalGrouping * optional : 0;

  document.querySelector('[data-thinking-budget-total="mandatory"]').textContent =
    mandatoryThinkingTotal;
  document.querySelector('[data-thinking-budget-total="optional"]').textContent =
    optionalThinkingTotal;
  document.querySelector('[data-so-output-total="mandatory"]').textContent =
    mandatorySoOutputTotal;
  document.querySelector('[data-so-output-total="optional"]').textContent =
    optionalSoOutputTotal;
  document.querySelector('[data-output-total-tokens="mandatory"]').textContent =
    mandatoryThinkingTotal + mandatorySoOutputTotal;
  document.querySelector('[data-output-total-tokens="optional"]').textContent =
    optionalThinkingTotal + optionalSoOutputTotal;
}

function getPricingNumbers(modelId) {
  const pricing = PRICING[modelId];
  return {
    inputCost: Number(pricing.inputCost),
    inputCaching: Number(pricing.inputCaching),
    outputCost: Number(pricing.outputCost),
    outputCaching: Number(pricing.outputCaching),
  };
}

function getInputTotalTokens(groups, column, fieldCount) {
  if (fieldCount === 0) return 0;
  const soPerGroup = Number(soTokensPerGroup.value) || 0;
  const documentSize = columnReceivesDocumentSize(column)
    ? Number(documentSizeTokens.value) || 0
    : 0;
  return soPerGroup * groups + documentSize;
}

function getOutputTotalTokens(column, groups, fieldCount) {
  if (fieldCount === 0) return 0;
  const thinkingPerPrompt = Number(thinkingBudgetPerPrompt.value) || 0;
  const grouping =
    column === "mandatory"
      ? Number(mandatoryGroupingFactor.value) || 0
      : Number(optionalGroupingFactor.value) || 0;
  const soOutputPerField =
    column === "mandatory"
      ? Number(mandatorySoOutputTokensPerField.value) || 0
      : Number(optionalSoOutputTokensPerField.value) || 0;

  const thinkingTotal = thinkingPerPrompt * groups;
  const soOutputTotal = soOutputPerField * grouping * groups;
  return thinkingTotal + soOutputTotal;
}

function formatCost(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  }).format(amount);
}

function setEstimatedCost(key, column, value) {
  document.querySelector(
    `[data-estimated-cost="${key}"][data-column-value="${column}"]`
  ).textContent = formatCost(value);
}

function updateExtractionSummary(invoicesMonthly, totalCostSum) {
  document.getElementById("extraction-invoices-monthly").textContent =
    new Intl.NumberFormat("en-US").format(invoicesMonthly);
  document.getElementById("extraction-total-cost").textContent =
    formatCost(totalCostSum);
}

function clearEstimatedCostColumn(column) {
  [
    "oneTimeInput",
    "promptInput",
    "cachedInput",
    "outputCost",
    "totalCostPerDocument",
    "inputCostTotal",
    "outputCostMonthly",
    "totalCost",
  ].forEach((key) => setEstimatedCost(key, column, 0));
}

function updateEstimatedCostTable() {
  updateModelTableHeaders("estimated-cost-table", "data-estimated-cost-header");

  const models = {
    mandatory: mandatoryModel.value,
    optional: optionalModel.value,
  };
  const { mandatory, optional } = getColumnGroups();
  const promptSize = Number(promptSizeTokens.value) || 0;
  const invoicesMonthly =
    (Number(invoicesDay.value) || 0) * (Number(workingDays.value) || 0);
  let totalCostSum = 0;

  ["mandatory", "optional"].forEach((column) => {
    const fieldCount = getFieldCount(column);
    if (fieldCount === 0) {
      clearEstimatedCostColumn(column);
      return;
    }

    const ocrCost = getOcrCostForColumn(column);
    const groups = column === "mandatory" ? mandatory : optional;
    const pricing = getPricingNumbers(models[column]);
    const inputTotalTokens = getInputTotalTokens(groups, column, fieldCount);
    const outputTotalTokens = getOutputTotalTokens(column, groups, fieldCount);

    const oneTimeInput = inputTotalTokens * pricing.inputCaching;
    const promptInput = promptSize * groups * pricing.inputCost;
    const cachedInput =
      groups * inputTotalTokens * pricing.outputCaching;
    const outputCost = outputTotalTokens * pricing.outputCost;

    const inputCostTotal =
      (oneTimeInput + promptInput + cachedInput) * invoicesMonthly;
    const outputCostMonthly = outputCost * invoicesMonthly;

    setEstimatedCost("oneTimeInput", column, oneTimeInput);
    setEstimatedCost("promptInput", column, promptInput);
    setEstimatedCost("cachedInput", column, cachedInput);
    setEstimatedCost("outputCost", column, outputCost);
    setEstimatedCost(
      "totalCostPerDocument",
      column,
      oneTimeInput + promptInput + cachedInput + outputCost
    );
    setEstimatedCost("inputCostTotal", column, inputCostTotal);
    setEstimatedCost("outputCostMonthly", column, outputCostMonthly);
    setEstimatedCost(
      "totalCost",
      column,
      inputCostTotal + outputCostMonthly + ocrCost
    );
    totalCostSum += inputCostTotal + outputCostMonthly + ocrCost;
  });

  updateExtractionSummary(invoicesMonthly, totalCostSum);
}

function updateStatisticsTable() {
  const day = Number(invoicesDay.value) || 0;
  const days = Number(workingDays.value) || 0;
  const mandatory = Number(mandatoryFields.value) || 0;
  const optional = Number(optionalFields.value) || 0;

  document.querySelector('[data-stat="invoices-monthly"]').textContent =
    day * days;
  document.querySelector('[data-stat="fields-total"]').textContent =
    mandatory + optional;

  updateColumnVisibility();
  updatePricingTable();
  updateInputTokensTable();
  updateOutputTokensTable();
  updateEstimatedCostTable();
}

function updateView() {
  updateStatisticsTable();
}

[
  invoicesDay,
  workingDays,
  documentSizeTokens,
  soTokensPerGroup,
  promptSizeTokens,
  thinkingBudgetPerPrompt,
  mandatorySoOutputTokensPerField,
  optionalSoOutputTokensPerField,
  mandatoryGroupingFactor,
  optionalGroupingFactor,
  mandatoryModel,
  optionalModel,
  mandatoryFields,
  optionalFields,
  mandatoryEstimatedOcrCost,
  optionalEstimatedOcrCost,
].forEach((control) => {
  control.addEventListener("input", updateView);
  control.addEventListener("change", updateView);
});

updateView();
