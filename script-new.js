"use strict";

/* ==========================================
   MONEY HACKS
   Dynamic Store | Cart | Checkout | Orders
========================================== */

const WORKER_URL =
  "https://money-hacks-orders.syedsamiulrizvi.workers.dev";

const TELEGRAM_USERNAME = "MoneyHackTeams";

const PAYMENT_WALLETS = {
  USDT: {
    network: "BEP20 (BNB Smart Chain)",
    address: "0x39ea01f18274c33efbdcd4b057579a6d5f5b8ade"
  },
  BTC: {
    network: "Bitcoin",
    address: "12xGywXdQbVDPwqQXYdsXgYJszTTrgaXtH"
  },
  ETH: {
    network: "Ethereum (ERC20)",
    address: "0x39ea01f18274c33efbdcd4b057579a6d5f5b8ade"
  }
};

const CART_KEY = "moneyHacksCart";

let products = [];
let siteSettings = {};
let cart = loadCart();

/* ==========================================
   SHORTCUTS AND HELPERS
========================================== */

const $ = (id) => document.getElementById(id);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(value) {
  return "$" + Number(value || 0).toFixed(2);
}

function showMessage(element, message, isError = false) {
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#ff6b6b" : "#d4af37";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(WORKER_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid server response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || result.error || "Something went wrong."
    );
  }

  return result;
}

/* ==========================================
   CART STORAGE
========================================== */

function loadCart() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CART_KEY) || "[]"
    );

    if (!Array.isArray(saved)) return [];

    return saved
      .filter(item =>
        item &&
        Number.isInteger(Number(item.id)) &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) >= 1 &&
        Number(item.quantity) <= 20
      )
      .map(item => ({
        id: Number(item.id),
        quantity: Number(item.quantity)
      }));

  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCart();
}

function getProduct(id) {
  return products.find(
    product => Number(product.id) === Number(id)
  );
}

function getCartTotal() {
  return cart.reduce((total, item) => {
    const product = getProduct(item.id);

    if (!product) return total;

    return total +
      Number(product.price) * Number(item.quantity);
  }, 0);
}

/* ==========================================
   LOAD CATALOG
========================================== */

async function loadCatalog() {
  const grid = $("productGrid");

  if (grid) {
    grid.innerHTML = "<p>Loading products...</p>";
  }

  try {
    const result = await apiRequest("/catalog");

    products = Array.isArray(result.products)
      ? result.products.filter(
          product => product.active !== false
        )
      : [];

    siteSettings = result.settings || {};

    // Remove products that are no longer available.
    cart = cart.filter(item => getProduct(item.id));

    updateCategoryOptions();
    renderProducts();
    saveCart();
    applySiteSettings();

  } catch (error) {
    console.error("Catalog error:", error);

    if (grid) {
      grid.innerHTML =
        '<p class="empty-message">Unable to load products. Please refresh the page.</p>';
    }
  }
}

/* ==========================================
   DYNAMIC CATEGORY OPTIONS
========================================== */

function updateCategoryOptions() {
  const select = $("categoryFilter");
  if (!select) return;

  const selectedValue = select.value || "all";

  const categories = [
    ...new Set(
      products
        .map(product => product.category)
        .filter(Boolean)
    )
  ];

  const labels = {
    "gift-cards": "Gift Cards",
    "software": "Software",
    "downloads": "Digital Downloads",
    "education": "Education",
    "design": "Design",
    "templates": "Templates"
  };

  select.innerHTML = `
    <option value="all">All Categories</option>
    ${categories.map(category => `
      <option value="${escapeHTML(category)}">
        ${escapeHTML(labels[category] || category)}
      </option>
    `).join("")}
  `;

  if (
    selectedValue === "all" ||
    categories.includes(selectedValue)
  ) {
    select.value = selectedValue;
  }
}

/* ==========================================
   HOMEPAGE SETTINGS
========================================== */

function applySiteSettings() {
  const logoText = document.querySelector("#siteLogo .logo-text");
  const logoImage = $("siteLogoImage");

  if (logoImage && logoText) {
    const logoUrl = siteSettings.logoUrl || "";

    if (logoUrl.startsWith("https://")) {
      logoImage.src = logoUrl;
      logoImage.style.display = "block";
      logoText.style.display = "none";

      logoImage.onerror = () => {
        logoImage.style.display = "none";
        logoText.style.display = "";
      };
    } else {
      logoImage.style.display = "none";
      logoText.style.display = "";
    }
  }
  const headline = document.querySelector(".hero-content h1");
  const intro = document.querySelector(".hero-description");
  const offerTitle = document.querySelector(".offer-card h3");
  const offerText = document.querySelector(".offer-card p");
  const telegramButton = $("telegramBtn");

  if (headline && siteSettings.headline) {
    headline.textContent = siteSettings.headline;
  }

  if (intro && siteSettings.intro) {
    intro.textContent = siteSettings.intro;
  }

  if (offerTitle && siteSettings.offerTitle) {
    offerTitle.textContent = siteSettings.offerTitle;
  }

  if (offerText && siteSettings.offerText) {
    offerText.textContent = siteSettings.offerText;
  }

  if (siteSettings.bannerImage) {
    const hero = document.querySelector(".hero");

    if (hero) {
      const imageURL = siteSettings.bannerImage;

      hero.style.backgroundImage =
        `linear-gradient(rgba(0,0,0,.75), rgba(0,0,0,.85)), url("${imageURL}")`;

      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center";
    }
  }

  if (telegramButton) {
    const username = (
      siteSettings.telegramUsername || TELEGRAM_USERNAME
    ).replace(/^@/, "");

    telegramButton.href =
      `https://t.me/${encodeURIComponent(username)}`;

    telegramButton.target = "_blank";
    telegramButton.rel = "noopener noreferrer";
  }
}

/* ==========================================
   PRODUCT RENDERING
========================================== */

function renderProducts() {
  const grid = $("productGrid");
  if (!grid) return;

  const search = (
    $("productSearch")?.value || ""
  ).trim().toLowerCase();

  const category =
    $("categoryFilter")?.value || "all";

  const filtered = products.filter(product => {
    const name = String(product.name || "").toLowerCase();

    const description = String(
      product.description || ""
    ).toLowerCase();

    const matchesSearch =
      name.includes(search) ||
      description.includes(search);

    const matchesCategory =
      category === "all" ||
      product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    grid.innerHTML =
      '<p class="empty-message">No products found.</p>';

    return;
  }

  grid.innerHTML = filtered.map(product => {
    const image = product.imageUrl
      ? `
        <img
          src="${escapeHTML(product.imageUrl)}"
          alt="${escapeHTML(product.name)}"
          class="product-image"
          loading="lazy"
          onerror="this.style.display='none'">
      `
      : `
        <div class="product-icon">
          ${escapeHTML(product.icon || "📦")}
        </div>
      `;

    return `
      <article class="product-card">
        ${image}

        <div class="product-info">
          <h3>${escapeHTML(product.name)}</h3>

          <p>${escapeHTML(product.description || "")}</p>

          <div class="product-price">
            ${money(product.price)}
          </div>

          <button
            type="button"
            class="btn btn-primary add-to-cart"
            data-product-id="${Number(product.id)}">
            Add to Cart
          </button>
        </div>
      </article>
    `;
  }).join("");
}

/* ==========================================
   ADD AND REMOVE CART ITEMS
========================================== */

function addToCart(id) {
  const product = getProduct(id);

  if (!product) return;

  const existing = cart.find(
    item => Number(item.id) === Number(id)
  );

  if (existing) {
    if (existing.quantity >= 20) {
      alert("Maximum quantity is 20.");
      return;
    }

    existing.quantity++;
  } else {
    cart.push({
      id: Number(id),
      quantity: 1
    });
  }

  saveCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(
    entry => Number(entry.id) === Number(id)
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(
      entry => Number(entry.id) !== Number(id)
    );
  }

  if (item.quantity > 20) {
    item.quantity = 20;
  }

  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter(
    item => Number(item.id) !== Number(id)
  );

  saveCart();
}

/* ==========================================
   CART DISPLAY
========================================== */

function updateCart() {
  const cartContainer = $("cartItems");
  const subtotal = $("cartSubtotal");
  const total = $("cartTotal");
  const count = $("cartCount");

  const validCart = cart.filter(
    item => getProduct(item.id)
  );

  const quantityCount = validCart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (count) {
    count.textContent = quantityCount;
  }

  if (cartContainer) {
    if (!validCart.length) {
      cartContainer.innerHTML =
        '<p class="empty-message">Your cart is currently empty.</p>';
    } else {
      cartContainer.innerHTML = validCart.map(item => {
        const product = getProduct(item.id);

        return `
          <div class="cart-item">
            <div>
              <h4>${escapeHTML(product.name)}</h4>
              <p>
                ${money(product.price)} × ${item.quantity}
              </p>
            </div>

            <div class="cart-controls">
              <button
                type="button"
                data-cart-action="decrease"
                data-id="${Number(item.id)}">−</button>

              <span>${item.quantity}</span>

              <button
                type="button"
                data-cart-action="increase"
                data-id="${Number(item.id)}">+</button>

              <button
                type="button"
                data-cart-action="remove"
                data-id="${Number(item.id)}">
                Remove
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  const amount = getCartTotal();

  if (subtotal) subtotal.textContent = money(amount);
  if (total) total.textContent = money(amount);

  updateCheckoutButton();
}

function updateCheckoutButton() {
  const button = $("checkoutBtn");

  if (button) {
    button.disabled = cart.length === 0;
  }
}

/* ==========================================
   PAYMENT DETAILS
========================================== */

function updatePaymentDetails() {
  const method = $("paymentMethod")?.value;
  const details = $("paymentDetails");

  const title = $("paymentTitle");
  const network = $("paymentNetwork");
  const address = $("walletAddress");

  if (!details) return;

  const wallet = PAYMENT_WALLETS[method];

  if (!wallet) {
    details.hidden = true;
    return;
  }

  details.hidden = false;

  if (title) {
    title.textContent = `${method} Payment Information`;
  }

  if (network) {
    network.textContent = `Network: ${wallet.network}`;
  }

  if (address) {
    address.textContent = wallet.address;
  }
}

async function copyWalletAddress() {
  const address = $("walletAddress")?.textContent.trim();

  if (!address) return;

  try {
    await navigator.clipboard.writeText(address);
    alert("Wallet address copied.");
  } catch {
    alert("Unable to copy. Please copy the address manually.");
  }
}

/* ==========================================
   CHECKOUT
========================================== */

async function submitOrder(event) {
  event.preventDefault();

  const form = $("checkoutForm");
  const message = $("checkoutMessage");

  if (!form) return;

  if (!cart.length) {
    showMessage(message, "Your cart is empty.", true);
    return;
  }

  const name = $("customerName")?.value.trim();
  const contact = $("customerContact")?.value.trim();
  const paymentMethod = $("paymentMethod")?.value;
  const transactionId = $("transactionId")?.value.trim();

  const confirmation = $("paymentConfirmation");

  if (
    !name ||
    !contact ||
    !paymentMethod ||
    !transactionId ||
    !confirmation?.checked
  ) {
    showMessage(
      message,
      "Please complete all required fields and confirm your details.",
      true
    );

    return;
  }

  if (!PAYMENT_WALLETS[paymentMethod]) {
    showMessage(message, "Invalid payment method.", true);
    return;
  }

  const submitButton = $("placeOrderBtn");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
  }

  showMessage(message, "Submitting your order...");

  try {
    const result = await apiRequest("/order", {
      method: "POST",

      body: JSON.stringify({
        name,
        contact,
        paymentMethod,
        transactionId,

        items: cart.map(item => ({
          id: Number(item.id),
          quantity: Number(item.quantity)
        }))
      })
    });

    const order = result.order || result;

    cart = [];
    saveCart();

    form.reset();
    updatePaymentDetails();

    showOrderSuccess(order);

  } catch (error) {
    showMessage(message, error.message, true);

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Order";
    }
  }
}

/* ==========================================
   ORDER SUCCESS
========================================== */

function showOrderSuccess(order) {
  const resultBox = $("checkoutMessage");

  if (!resultBox) return;

  resultBox.innerHTML = `
    <div class="order-success">
      <h3>Order Submitted Successfully!</h3>

      <p>
        <strong>Order ID:</strong>
        ${escapeHTML(order.orderId || "")}
      </p>

      <p>
        <strong>Access Code:</strong>
        ${escapeHTML(order.accessCode || "")}
      </p>

      <p>
        <strong>Total:</strong>
        ${money(order.total)}
      </p>

      <p>
        <strong>Payment:</strong>
        ${escapeHTML(order.paymentMethod || "")}
      </p>

      <p><strong>Status:</strong> PENDING</p>

      <p>
        Please save your Order ID and Access Code.
      </p>

      <a
        href="https://t.me/${encodeURIComponent(TELEGRAM_USERNAME)}"
        target="_blank"
        rel="noopener noreferrer">
        Contact Support
      </a>
    </div>
  `;
}

/* ==========================================
   MY ORDERS
========================================== */

async function lookupOrder(event) {
  event.preventDefault();

  const message = $("orderLookupMessage");

  const orderId = $("lookupOrderId")?.value.trim();
  const accessCode = $("lookupAccessCode")?.value.trim();

  if (!orderId || !accessCode) {
    showMessage(
      message,
      "Enter your Order ID and Access Code.",
      true
    );

    return;
  }

  const button = $("lookupOrderBtn");

  if (button) {
    button.disabled = true;
    button.textContent = "Searching...";
  }

  showMessage(message, "Looking up your order...");

  try {
    const result = await apiRequest("/orders", {
      method: "POST",

      body: JSON.stringify({
        orderId,
        accessCode
      })
    });

    const order = result.order || result;

    renderOrderDetails(order);

  } catch (error) {
    showMessage(message, error.message, true);

    const history = $("orderHistoryResult");

    if (history) {
      history.hidden = true;
      history.innerHTML = "";
    }

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Find My Order";
    }
  }
}

function renderOrderDetails(order) {
  const container = $("orderHistoryResult");
  const message = $("orderLookupMessage");

  if (!container) return;

  const customerName =
    order.name || order.customerName || "";

  const status =
    order.status || order.orderStatus || "PENDING";

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const itemHTML = items.map(item => `
    <li>
      ${escapeHTML(item.name || "Product")}
      × ${Number(item.quantity || 1)}
      — ${money(item.lineTotal)}
    </li>
  `).join("");

  container.innerHTML = `
    <div class="order-result">
      <h3>Order Details</h3>

      <p>
        <strong>Order ID:</strong>
        ${escapeHTML(order.orderId || "")}
      </p>

      <p>
        <strong>Customer:</strong>
        ${escapeHTML(customerName)}
      </p>

      <p>
        <strong>Status:</strong>
        ${escapeHTML(status)}
      </p>

      <p>
        <strong>Payment:</strong>
        ${escapeHTML(order.paymentMethod || "")}
      </p>

      <p>
        <strong>Total:</strong>
        ${money(order.total)}
      </p>

      <h4>Products</h4>
      <ul>${itemHTML}</ul>
    </div>
  `;

  container.hidden = false;

  if (message) {
    message.textContent = "";
  }
}

/* ==========================================
   ADMIN ORDER STATUS
========================================== */

async function updateAdminOrder(event) {
  event.preventDefault();

  const message = $("adminMessage");

  const adminKey = $("adminKey")?.value.trim();
  const orderId = $("adminOrderId")?.value.trim();
  const orderStatus = $("adminOrderStatus")?.value;

  if (!adminKey || !orderId || !orderStatus) {
    showMessage(message, "Complete all fields.", true);
    return;
  }

  try {
    showMessage(message, "Updating order...");

    await apiRequest("/admin/order-status", {
      method: "POST",

      headers: {
        "X-Admin-Key": adminKey
      },

      body: JSON.stringify({
        orderId,
        orderStatus
      })
    });

    showMessage(
      message,
      "Order status updated successfully."
    );

  } catch (error) {
    showMessage(message, error.message, true);
  }
}

/* ==========================================
   MOBILE NAVIGATION
========================================== */

function setupMobileNavigation() {
  const button = $("menuBtn");
  const navbar = $("navbar");

  if (!button || !navbar) return;

  button.addEventListener("click", () => {
    navbar.classList.toggle("active");

    const expanded =
      navbar.classList.contains("active");

    button.setAttribute(
      "aria-expanded",
      String(expanded)
    );
  });

  navbar.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navbar.classList.remove("active");
      button.setAttribute("aria-expanded", "false");
    });
  });
}

/* ==========================================
   INITIALIZE WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  // Load products and homepage settings.
  loadCatalog();

  // Product search and category filter.
  $("productSearch")?.addEventListener(
    "input",
    renderProducts
  );

  $("categoryFilter")?.addEventListener(
    "change",
    renderProducts
  );

  // Add to cart.
  $("productGrid")?.addEventListener("click", event => {
    const button = event.target.closest("[data-product-id]");

    if (!button) return;

    addToCart(button.dataset.productId);
  });

  // Cart controls.
  $("cartItems")?.addEventListener("click", event => {
    const button = event.target.closest("[data-cart-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.cartAction;

    if (action === "increase") {
      changeQuantity(id, 1);
    }

    if (action === "decrease") {
      changeQuantity(id, -1);
    }

    if (action === "remove") {
      removeFromCart(id);
    }
  });

  // Checkout.
  $("checkoutForm")?.addEventListener(
    "submit",
    submitOrder
  );

  $("checkoutBtn")?.addEventListener("click", () => {
    $("checkout")?.scrollIntoView({
      behavior: "smooth"
    });
  });

  // Payment.
  $("paymentMethod")?.addEventListener(
    "change",
    updatePaymentDetails
  );

  $("copyAddressBtn")?.addEventListener(
    "click",
    copyWalletAddress
  );

  updatePaymentDetails();

  // My Orders.
  $("orderLookupForm")?.addEventListener(
    "submit",
    lookupOrder
  );

  // Admin order status.
  $("adminUpdateForm")?.addEventListener(
    "submit",
    updateAdminOrder
  );

  // Mobile navigation.
  setupMobileNavigation();

  // Footer year.
  const year = $("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Initial cart display.
  updateCart();
});