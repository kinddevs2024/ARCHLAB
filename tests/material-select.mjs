import assert from "node:assert/strict";
export async function selectMaterial(control, selection) {
  const value = typeof selection === "object" ? selection.value : selection;
  const label = typeof selection === "object" ? selection.label : undefined;
  await control.click();
  const options = control.page().getByRole("option");
  await options.first().waitFor();
  for (const option of await options.all()) {
    if (
      (value !== undefined &&
        (await option.getAttribute("data-value")) === String(value)) ||
      (label !== undefined && (await option.innerText()).trim() === label)
    ) {
      await option.click();
      await options.first().waitFor({ state: "hidden" });
      return;
    }
  }
  assert.fail("Requested select option was not available");
}
