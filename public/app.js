const menuGrid = document.getElementById("menuGrid");
const cartPanel = document.getElementById("cartPanel");
const checkoutForm = document.getElementById("checkoutForm");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const deliveryFeeEl = document.getElementById("deliveryFee");
const statusMsg = document.getElementById("statusMsg");
const ordersList = document.getElementById("ordersList");

const DELIVERY_FEE = 2.5;
let menu = [];
let cart = {};

async function loadMenu() {
  const res = await fetch("/api/menu");
  menu = await res.json();
  renderMenu();
}

function renderMenu() {
  menuGrid.innerHTML = "";
  menu.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <span class="tag">${item.tag}</span>
      <h4>${item.name}</h4>
      <p>${item.desc}</p>
      <strong>$${item.price.toFixed(2)}</strong>
      <button class="primary">Add to cart</button>
    `;
    card.querySelector("button").addEventListener("click", () => addToCart(item));
    menuGrid.appendChild(card);
  });
}

function addToCart(item) {
  if (!cart[item.id]) {
    cart[item.id] = { ...item, qty: 0 };
  }
  cart[item.id].qty += 1;
  renderCart();
}

function updateQty(id, delta) {
  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
  }
  renderCart();
}

function renderCart() {
  const items = Object.values(cart);
  cartPanel.innerHTML = "";

  if (!items.length) {
    cartPanel.innerHTML = '<div class="cart-empty">Your cart is waiting.</div>';
    subtotalEl.textContent = "$0.00";
    totalEl.textContent = "$0.00";
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div>$${item.price.toFixed(2)}</div>
      </div>
      <div class="qty-controls">
        <button type="button">-</button>
        <span>${item.qty}</span>
        <button type="button">+</button>
      </div>
    `;
    const [minusBtn, , plusBtn] = row.querySelectorAll("button, span");
    minusBtn.addEventListener("click", () => updateQty(item.id, -1));
    plusBtn.addEventListener("click", () => updateQty(item.id, 1));
    cartPanel.appendChild(row);
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  deliveryFeeEl.textContent = `$${DELIVERY_FEE.toFixed(2)}`;
  totalEl.textContent = `$${(subtotal + DELIVERY_FEE).toFixed(2)}`;
}

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusMsg.textContent = "Submitting order...";

  const items = Object.values(cart).map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty
  }));

  if (!items.length) {
    statusMsg.textContent = "Please add items to your cart.";
    return;
  }

  const formData = new FormData(checkoutForm);
  const payload = {
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      deliveryTime: formData.get("deliveryTime")
    },
    items,
    total: parseFloat(totalEl.textContent.replace("$", ""))
  };

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error("Failed");
    }

    statusMsg.textContent = "Order placed successfully!";
    cart = {};
    checkoutForm.reset();
    renderCart();
    loadOrders();
  } catch (err) {
    statusMsg.textContent = "Could not place order. Is the server running?";
  }
});

async function loadOrders() {
  const res = await fetch("/api/orders");
  const orders = await res.json();
  ordersList.innerHTML = "";

  if (!orders.length) {
    ordersList.innerHTML = "<div class=\"cart-empty\">No orders yet.</div>";
    return;
  }

  orders.forEach((order) => {
    const card = document.createElement("div");
    card.className = "order-card";
    const itemsText = order.items
      .map((item) => `${item.qty}x ${item.name}`)
      .join(", ");
    card.innerHTML = `
      <strong>${order.customer?.name || "Guest"}</strong>
      <div>${itemsText}</div>
      <div>Total: $${order.total?.toFixed(2) || "0.00"}</div>
      <small>${new Date(order.createdAt).toLocaleString()}</small>
    `;
    ordersList.appendChild(card);
  });
}

const scrollMenu = document.getElementById("scrollMenu");
const viewOrders = document.getElementById("viewOrders");

scrollMenu.addEventListener("click", () => {
  document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
});

viewOrders.addEventListener("click", () => {
  document.getElementById("orders").scrollIntoView({ behavior: "smooth" });
});

loadMenu();
loadOrders();
