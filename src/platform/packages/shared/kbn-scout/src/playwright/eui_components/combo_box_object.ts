/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { EuiComboBoxObject } from '@elastic/eui-test-helpers';
import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

// Duplicated from the package's (unexported) `EuiComboBoxSelectors`; remove
// with this file once the fix ships upstream.
const INPUT_WRAPPER_TEST_SUBJ = 'comboBoxInput';
const SEARCH_INPUT_TEST_SUBJ = 'comboBoxSearchInput';
const PLAIN_TEXT_INPUT_WRAP_SELECTOR = '.euiComboBox__inputWrap--plainText';
const optionsListFor = (testSubj: string) => `[data-test-subj~="${testSubj}-optionsList"]`;
const optionFor = (testSubj: string) => `${optionsListFor(testSubj)} [role="option"]`;

/**
 * Fixed `setSelectedOptions` for {@link EuiComboBoxObject}; a fix for
 * `@elastic/eui-test-helpers` (see the package CONTRIBUTING guide) that lives
 * in kbn-scout until it is ported and published.
 *
 * Upstream's private `addOption` races the combo box's async re-filter: after
 * typing it only waits for "any option" to be present — which the stale,
 * unfiltered dropdown already satisfies — then snapshots the option texts and
 * clicks by index. When the list re-filters between the snapshot and the
 * click (a ~50ms window locally, much wider on loaded CI workers), the click
 * lands on nothing or the keyboard fallback fires against a re-rendering
 * list, the selection never commits, and the trailing selection poll fails
 * with `Expected [label] / Received []`.
 *
 * This subclass overrides `setSelectedOptions` with three fixes:
 * 1. waits until the dropdown actually contains the typed label (filter has
 *    settled), not just "count > 0";
 * 2. clicks the option through a text-anchored locator that re-resolves on
 *    every actionability retry, instead of a pre-computed index;
 * 3. verifies the selection committed and re-drives the fill+click once
 *    before failing, covering parent-controlled combos whose re-render can
 *    swallow the change.
 */
export class ComboBoxObject extends EuiComboBoxObject {
  /**
   * Replace the current selection with `labels`. Same contract as the
   * upstream method: set-semantics, order-independent, no-op when the current
   * selection already matches, throws when a label never appears in the
   * dropdown. `timeout` bounds how long each option is awaited in the
   * dropdown after typing — raise it for slow / server-backed combos whose
   * options load asynchronously.
   */
  override async setSelectedOptions(
    labels: string[],
    { timeout = 2_500 }: { timeout?: number } = {}
  ): Promise<void> {
    // Dedupe while preserving order.
    const targetLabels = [...new Set(labels)];
    // `[...arr].sort()` (not `arr.sort()`) — sort mutates in place; the copy
    // avoids mutating either the consumer's input or our internal state.
    const sortedTarget = [...targetLabels].sort();
    const sortedCurrent = [...(await this.getSelectedOptions())].sort();

    // Set-equality short-circuit (any order).
    if (
      sortedCurrent.length === sortedTarget.length &&
      sortedCurrent.every((label, i) => label === sortedTarget[i])
    ) {
      return;
    }

    const plainText = await this.isPlainTextMode();

    // Naive replace — clear, then add each. Exception: asPlainText single-select
    // replaces its selection when a new option is picked, so clearing first is
    // unnecessary — and its input can hold a non-clearable default (a placeholder
    // rendered as the value) that clear() can't empty. Still clear when the target
    // is empty (nothing to select would leave the old selection in place).
    if (targetLabels.length === 0 || !plainText) {
      await this.clear();
    }
    for (const label of targetLabels) {
      await this.pickOption(label, timeout);
    }
    if (targetLabels.length > 0 && !plainText) {
      // Blur the input to close the dropdown. Using blur() rather than a
      // keyboard event avoids bubbling Escape to page-level handlers
      // (modal/flyout close listeners) on the consumer page. Skipped for
      // asPlainText: picking an option there already commits and closes the
      // dropdown, and an extra blur can race the (often parent-controlled)
      // selectedOptions update and discard the just-picked value.
      await this.comboSearchInput.blur();
    }

    // Verify the full selection committed. A parent-controlled combo commits
    // via the consumer's onChange, which can land a tick after the click — or,
    // when its re-render swallows the change, never. Poll briefly, then
    // re-drive the missing labels once before failing.
    try {
      await this.expectSelection(sortedTarget, timeout);
    } catch {
      const committed = await this.getSelectedOptions();
      for (const label of targetLabels.filter((l) => !committed.includes(l))) {
        await this.pickOption(label, timeout);
      }
      await this.expectSelection(sortedTarget, timeout);
    }
  }

  private async expectSelection(sortedTarget: string[], timeout: number): Promise<void> {
    await expect
      .poll(() => this.getSelectedOptions().then((options) => [...options].sort()), { timeout })
      .toStrictEqual(sortedTarget);
  }

  /**
   * Type `label` into the search input, wait for the dropdown filter to
   * settle on it, then keyboard-select the option: walk the active option
   * with ArrowDown, read its label, and press Enter only on an exact match.
   *
   * Keyboard selection instead of clicking, deliberately: option rows carry
   * visually-hidden icon text that Playwright text matchers see concatenated
   * with the label (`"IP addressip"`), so text-filtered locators cannot match
   * exactly — and coordinate clicks race the virtualized list's re-renders.
   * The active-option walk reads the label via innerText (clean), scrolls
   * virtualized rows into view via EUI itself, and commits with Enter, which
   * EUI applies to the active option regardless of row coordinates.
   */
  private async pickOption(label: string, timeout: number): Promise<void> {
    // Clicking the outer wrapper does not reliably open the dropdown; the
    // inner `comboBoxInput` element does.
    await this.root.getByTestId(INPUT_WRAPPER_TEST_SUBJ).click();

    // Type to filter, then wait until the dropdown reflects the typed filter:
    // the target label must be among the visible options. Polling only for
    // "some options" is not enough — the stale, unfiltered list satisfies it.
    await this.comboSearchInput.fill(label);
    const trimmed = label.trim();
    const options = this.dropdownOptions;
    await expect
      .poll(async () => (await options.allInnerTexts()).map((text) => text.trim()), {
        timeout,
        message: `Expected option "${trimmed}" to appear in the "${this.testSubj}" combo box dropdown`,
      })
      .toContain(trimmed);

    // Walk the active option with ArrowDown and commit with Enter on the
    // exact label. Match on innerText (excludes hidden icon text); exactness
    // keeps "ip" from selecting "clientip". ArrowDown wraps around, so allow
    // two passes over the filtered options — transient "no active option"
    // reads during list re-renders consume steps without advancing the match.
    const maxSteps = (await options.count()) * 2 + 2;
    for (let step = 0; step < maxSteps; step++) {
      const activeText = await this.activeOptionText();
      if (activeText === trimmed) {
        await this.comboSearchInput.press('Enter');
        return;
      }
      await this.comboSearchInput.press('ArrowDown');
    }

    // No blind fallback: committing the wrong value is strictly worse than a
    // descriptive failure.
    const visible = (await options.allInnerTexts()).map((text) => text.trim());
    throw new Error(
      `Option "${trimmed}" could not be keyboard-selected in the "${this.testSubj}" ` +
        `combo box dropdown. Visible options: ${JSON.stringify(visible)}`
    );
  }

  private get comboSearchInput(): Locator {
    return this.root.getByTestId(SEARCH_INPUT_TEST_SUBJ);
  }

  /**
   * Label of the currently highlighted dropdown option, resolved through the
   * search input's `aria-activedescendant` (EUI's own record of the active
   * option); `undefined` when no option is active yet.
   */
  private async activeOptionText(): Promise<string | undefined> {
    const activeId = await this.comboSearchInput.getAttribute('aria-activedescendant');
    if (!activeId) {
      return undefined;
    }
    // Mid-re-render the virtualized list can briefly hold duplicate option ids
    // (row reuse), so scope to this combo's list and require EUI's focused
    // styling. 0 or >1 matches mean the list is transitioning — report "no
    // active option" and let the caller's walk loop re-read.
    const active = this.root
      .page()
      .locator(`${optionsListFor(this.testSubj)} [id="${activeId}"][class*="isFocused"]`);
    if ((await active.count()) !== 1) {
      return undefined;
    }
    return (await active.innerText()).trim();
  }

  private get dropdownOptions(): Locator {
    return this.root.page().locator(optionFor(this.testSubj));
  }

  private async isPlainTextMode(): Promise<boolean> {
    return (await this.root.locator(PLAIN_TEXT_INPUT_WRAP_SELECTOR).count()) > 0;
  }
}
