function claimMastElement(el, key) {
  const prop = `mast${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  if (el.dataset[prop] === "ready") return false;
  el.dataset[prop] = "ready";
  return true;
}
const registries = /* @__PURE__ */ new Map();
function onMastGlobal(target, type, owner, handler) {
  const key = `${target}:${type}`;
  let entries = registries.get(key);
  if (!entries) {
    const list = [];
    entries = list;
    registries.set(key, list);
    const on = target === "document" ? document : window;
    on.addEventListener(type, (e) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const entryOwner = list[i].owner;
        if (entryOwner && !entryOwner.isConnected) list.splice(i, 1);
      }
      list.slice().forEach((entry) => entry.handler(e));
    });
  }
  entries.push({ owner, handler });
}
export { claimMastElement, onMastGlobal };
