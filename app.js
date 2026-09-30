"use strict";
(() => {
const products = window.NOOR_CATALOG;
const helpers = window.NoorCart;
const $ = id => document.getElementById(id);
const money = value => "৳" + value.toLocaleString("en-BD");
const categories = ["All","Diapers","Wipes","Feeding","Baby Care"];
const storageKey = "noor-model-cart-v1";
let activeCategory = "All", cart = [], toastTimer;
function productFor(id) { return products.find(p => p.id === id); }
function node(tag,className,text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function persist() {
  try { localStorage.setItem(storageKey,JSON.stringify(cart)); } catch {}
}
try {
  cart = helpers.sanitize(JSON.parse(localStorage.getItem(storageKey) || "[]"),products);
} catch { cart = []; }
function notify(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $("toast").hidden = true; },2500);
}
function wireImage(id,fallbackId) {
  const image = $(id);
  const show = () => {
    image.hidden = false;
    if (fallbackId) $(fallbackId).hidden = true;
  };
  image.addEventListener("load",show);
  image.addEventListener("error",() => { image.hidden = true; });
  if (image.complete && image.naturalWidth > 0) show();
}
["brandLogo","aiwibiLogo","steadfastLogo"].forEach(id => wireImage(id));
wireImage("heroPhoto","heroFallback");
$("year").textContent = new Date().getFullYear();
function subtotal() { return helpers.subtotal(cart,products); }
function totalLabel() {
  const [min,max] = helpers.deliveryRange(subtotal(),$("deliveryArea").value);
  return min === max ? money(min) : money(min) + "–" + money(max);
}
function updateTotal() { $("checkoutTotal").textContent = totalLabel(); }
function selectCategory(category) {
  activeCategory = category;
  renderFilters();
  renderProducts();
}
function renderFilters() {
  $("filters").replaceChildren();
  categories.forEach(category => {
    const button = node("button","filter",category);
    button.type = "button";
    button.setAttribute("aria-pressed",String(category === activeCategory));
    button.addEventListener("click",() => selectCategory(category));
    $("filters").append(button);
  });
}
function renderProducts() {
  const query = $("search").value.trim().toLowerCase();
  const filtered = products.filter(p =>
    (activeCategory === "All" || p.category === activeCategory)
    && (p.name + " " + p.category).toLowerCase().includes(query));
  $("resultCount").textContent = filtered.length + " sample products";
  $("emptySearch").hidden = filtered.length > 0;
  $("productGrid").replaceChildren();
  filtered.forEach(product => {
    const article = node("article","product-card");
    const picture = node("div","product-picture");
    const placeholder = node("span","product-placeholder",product.icon);
    placeholder.setAttribute("aria-hidden","true");
    const image = document.createElement("img");
    image.alt = product.name;
    image.loading = "lazy";
    image.hidden = true;
    image.addEventListener("load",() => { image.hidden = false; placeholder.hidden = true; });
    image.addEventListener("error",() => { image.hidden = true; placeholder.hidden = false; });
    image.src = product.image;
    picture.append(placeholder,image,node("span","sample-badge","Sample listing"));
    const body = node("div","product-body");
    body.append(node("h3","",product.name),node("p","",product.description),
      node("div","product-price","Demo " + money(product.demoPrice)));
    const select = document.createElement("select");
    select.setAttribute("aria-label","Choose option for " + product.name);
    product.options.forEach(value => {
      const option = node("option","",value);
      option.value = value;
      select.append(option);
    });
    const add = node("button","button","Add to cart");
    add.type = "button";
    add.addEventListener("click",() => {
      const existing = cart.find(item => item.id === product.id && item.option === select.value);
      if (existing && existing.quantity >= 99) return notify("Maximum quantity reached.");
      if (existing) existing.quantity++;
      else cart.push({id:product.id,option:select.value,quantity:1});
      persist();
      renderCart();
      notify("Added to your demo cart.");
    });
    body.append(select,add);
    article.append(picture,body);
    $("productGrid").append(article);
  });
}
function renderCart(focusTarget) {
  $("cartCount").textContent = cart.reduce((sum,item) => sum + item.quantity,0);
  $("subtotal").textContent = money(subtotal());
  $("cartItems").replaceChildren();
  $("startCheckout").disabled = cart.length === 0;
  if (!cart.length) $("cartItems").append(node("p","","Your cart is empty."));
  cart.forEach((item,index) => {
    const product = productFor(item.id);
    const row = node("div","cart-row");
    row.append(node("strong","",product.name),
      node("small","",item.option + " · Demo " + money(product.demoPrice) + " each"));
    const controls = node("div","quantity");
    function quantityButton(text,delta,label) {
      const button = node("button","",text);
      button.type = "button";
      button.id = "quantity-" + index + "-" + (delta > 0 ? "plus" : "minus");
      button.setAttribute("aria-label",label + " " + product.name + ", " + item.option);
      button.disabled = delta > 0 && item.quantity >= 99;
      button.addEventListener("click",() => {
        const wasRemoved = item.quantity + delta < 1;
        item.quantity = Math.min(99,item.quantity + delta);
        if (wasRemoved) cart.splice(index,1);
        persist();
        renderCart(wasRemoved ? "closeCartFocus" : button.id);
      });
      return button;
    }
    const remove = node("button","remove","Remove");
    remove.type = "button";
    remove.setAttribute("aria-label","Remove " + product.name + ", " + item.option);
    remove.addEventListener("click",() => {
      cart.splice(index,1);persist();renderCart("closeCartFocus");
    });
    controls.append(
      quantityButton("−",-1,"Decrease quantity of"),
      node("span","",String(item.quantity)),
      quantityButton("+",1,"Increase quantity of"),
      remove);
    row.append(controls);
    $("cartItems").append(row);
  });
  updateTotal();
  if (focusTarget) {
    const target = focusTarget === "closeCartFocus"
      ? $("cartDialog").querySelector(".close") : $(focusTarget);
    if (target && !target.disabled) target.focus();
    else $("cartDialog").querySelector(".close").focus();
  }
}
$("search").addEventListener("input",renderProducts);
document.querySelectorAll("[data-category]").forEach(link =>
  link.addEventListener("click",() => selectCategory(link.dataset.category)));
document.querySelectorAll("[data-close]").forEach(button =>
  button.addEventListener("click",() => $(button.dataset.close).close()));
$("openCart").addEventListener("click",() => { renderCart();$("cartDialog").showModal(); });
$("startCheckout").addEventListener("click",() => {
  if (!cart.length) return;
  $("cartDialog").close();
  $("checkoutForm").hidden = false;
  $("requestPreview").hidden = true;
  updateTotal();
  $("checkoutDialog").showModal();
});
$("deliveryArea").addEventListener("change",updateTotal);
$("checkoutForm").addEventListener("submit",event => {
  event.preventDefault();
  if (!cart.length) return notify("Add an item first.");
  const data = new FormData(event.currentTarget);
  const name = String(data.get("customerName") || "").trim();
  const address = String(data.get("address") || "").trim();
  if (!name || !address) return notify("Enter your name and delivery address.");
  const lines = cart.map(item => {
    const p = productFor(item.id);
    return p.name + " (" + item.option + ") × " + item.quantity
      + " — demo " + money(p.demoPrice * item.quantity);
  });
  const message = [
    "NOOR Baby Care — WEBSITE MODEL ENQUIRY",
    "Sample prices only. Please confirm real prices and stock.","",
    ...lines,"",
    "Demo subtotal: " + money(subtotal()),
    "Delivery: " + ($("deliveryArea").value === "dhaka" ? "Dhaka ৳70" : "Outside Dhaka ৳150–200"),
    "Demo total including delivery: " + totalLabel(),
    "Requested payment: Cash on delivery","",
    "Name: " + name,
    "Mobile: " + String(data.get("phone") || "").trim(),
    "Address: " + address,"",
    "Please confirm availability, final delivery charge and selling prices before processing."
  ].join("\n");
  $("requestOutput").textContent = message;
  $("sendRequest").href = "https://wa.me/8801410486844?text=" + encodeURIComponent(message);
  $("checkoutForm").hidden = true;
  $("requestPreview").hidden = false;
  $("sendRequest").focus();
});
$("editRequest").addEventListener("click",() => {
  $("requestPreview").hidden = true;
  $("checkoutForm").hidden = false;
  $("customerName").focus();
});
renderFilters();renderProducts();renderCart();
})();
