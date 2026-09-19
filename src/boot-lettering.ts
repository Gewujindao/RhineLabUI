import "./boot-lettering.css";

// Keep the startup promise interface. Wanxiang uses native text and the page's
// existing font stack; original fixed-phrase drawings are not a text renderer.
export async function loadBootWebfonts() {
  await document.fonts.ready;
  return true;
}

/** A native text node following the opening's existing reveal timeline. */
export class BootLettering {
  private label = document.createElement("span");
  private value: string | undefined;

  constructor(host: HTMLElement, _keys?: readonly string[]) {
    this.label.className = "boot-phrase";
    host.classList.add("has-boot-lettering");
    host.dataset.letteringRenderer = "native";
    host.replaceChildren(this.label);
  }

  setText(value: string) {
    if (this.value === value) return;
    this.value = value;
    this.label.textContent = value;
  }
}
