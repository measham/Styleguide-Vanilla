import { claimMastElement } from "./shared.js";
let clicksHandled = false;
function initModals() {
  const dialogs = document.querySelectorAll("dialog");
  if (dialogs.length === 0) return;
  if (!clicksHandled) {
    clicksHandled = true;
    document.addEventListener("click", handleModalClicks);
  }
  dialogs.forEach((dialog) => {
    if (!claimMastElement(dialog, "modal")) return;
    setupDialogClickOutside(dialog);
    handleAutoOpenModal(dialog);
  });
}
function handleModalClicks(e) {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const trigger = target.closest("dialog + button");
  if (trigger) {
    e.preventDefault();
    const dialog = trigger.previousElementSibling;
    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
    }
    return;
  }
  if (target.closest('dialog button.modal_close-button, dialog button[data-modal="close"]')) {
    e.preventDefault();
    const dialog = target.closest("dialog");
    dialog?.close();
  }
}
function setupDialogClickOutside(dialog) {
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    handleModalClose(dialog);
  });
}
function handleAutoOpenModal(dialog) {
  if (dialog.dataset.modalOpenOnLoad !== "true") return;
  const cooldownDays = parseInt(dialog.dataset.modalCooldownDays ?? "", 10) || 0;
  if (cooldownDays > 0) {
    const modalId = getModalId(dialog);
    if (modalId && isInCooldown(modalId)) return;
  }
  dialog.showModal();
}
function handleModalClose(dialog) {
  const cooldownDays = parseInt(dialog.dataset.modalCooldownDays ?? "", 10);
  if (cooldownDays > 0) {
    const modalId = getModalId(dialog);
    if (modalId) {
      storeCooldownTimestamp(modalId, cooldownDays);
    }
  }
}
function getModalId(dialog) {
  const parent = dialog.parentElement;
  if (!parent || !parent.id) return null;
  return parent.id;
}
function isInCooldown(modalId) {
  try {
    const storageKey = `modal-cooldown-${modalId}`;
    const cooldownUntil = localStorage.getItem(storageKey);
    if (!cooldownUntil) return false;
    if (Date.now() > parseInt(cooldownUntil, 10)) {
      localStorage.removeItem(storageKey);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
function storeCooldownTimestamp(modalId, days) {
  try {
    const storageKey = `modal-cooldown-${modalId}`;
    const cooldownUntil = Date.now() + days * 24 * 60 * 60 * 1e3;
    localStorage.setItem(storageKey, cooldownUntil.toString());
  } catch {}
}
export { initModals };
