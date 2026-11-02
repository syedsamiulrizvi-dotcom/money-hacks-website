// =====================================
// MONEY HACKS - COMPLETE STORE SYSTEM
// =====================================

// 1. CONFIGURATION

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

// 2. PRODUCT CATALOG

const products = [
    { id: 1, name: "Digital Gift Card", category: "gift-cards", description: "Authorized digital gift card.", price: 10, icon: "🎁" },
    { id: 2, name: "Premium Gift Card", category: "gift-cards", description: "Genuine and authorized gift card.", price: 25, icon: "🎟️" },
    { id: 3, name: "Software License", category: "software", description: "Genuine software license.", price: 15, icon: "💻" },
    { id: 4, name: "Digital Resource Pack", category: "downloads", description: "Useful digital files and resources.", price: 8, icon: "📦" },
    { id: 5, name: "Premium Digital Bundle", category: "downloads", description: "Authorized digital downloads.", price: 20, icon: "⭐" },
    { id: 6, name: "Software Bundle", category: "software", description: "Authorized software products.", price: 30, icon: "🖥️" }
];

// 3. CART STORAGE

function loadCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("moneyHacksCart") || "[]"
        );

        if (!Array.isArray(saved)) return [];

        return saved
            .filter(item =>
                products.some(p => p.id === item.id) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                item.quantity <= 20
            )
            .map(item => ({
                ...products.find(p => p.id === item.id),
                quantity: item.quantity
            }));
    } catch {
        return [];
    }
}

let cart = loadCart();

function saveCart() {
    try {
        localStorage.setItem(
            "moneyHacksCart",
            JSON.stringify(
                cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity
                }))
            )
        );
    } catch (error) {
        console.error("Cart storage error:", error);
    }
}

// 4. HTML ELEMENTS

const menuBtn = document.getElementById("menuBtn");
const navbar = document.getElementById("navbar");

const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const noProducts = document.getElementById("noProducts");

const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");

const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutForm = document.getElementById("checkoutForm");

const paymentMethod = document.getElementById("paymentMethod");
const paymentDetails = document.getElementById("paymentDetails");
const paymentTitle = document.getElementById("paymentTitle");
const paymentNetwork = document.getElementById("paymentNetwork");
const walletAddress = document.getElementById("walletAddress");
const copyAddressBtn = document.getElementById("copyAddressBtn");

const checkoutMessage = document.getElementById("checkoutMessage");
const placeOrderBtn = document.getElementById("placeOrderBtn");

const telegramBtn = document.getElementById("telegramBtn");

// MY ORDERS

const orderLookupForm = document.getElementById("orderLookupForm");
const lookupOrderId = document.getElementById("lookupOrderId");
const lookupAccessCode = document.getElementById("lookupAccessCode");
const lookupOrderBtn = document.getElementById("lookupOrderBtn");
const orderLookupMessage = document.getElementById("orderLookupMessage");
const orderHistoryResult = document.getElementById("orderHistoryResult");

// ADMIN

const adminUpdateForm = document.getElementById("adminUpdateForm");
const adminKey = document.getElementById("adminKey");
const adminOrderId = document.getElementById("adminOrderId");
const adminOrderStatus = document.getElementById("adminOrderStatus");
const adminUpdateBtn = document.getElementById("adminUpdateBtn");
const adminUpdateMessage = document.getElementById("adminUpdateMessage");

// 5. HELPERS

function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
}

function getCartTotal() {
    return cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
}

function getCartCount() {
    return cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );
}

async function copyText(value, button, originalText) {
    try {
        await navigator.clipboard.writeText(String(value));

        if (button) {
            button.textContent = "Copied!";

            setTimeout(() => {
                button.textContent = originalText;
            }, 1800);
        }
    } catch {
        alert("Copy failed. Please copy the text manually.");
    }
}

// 6. DISPLAY PRODUCTS

function displayProducts() {
    if (!productGrid) return;

    const searchText = productSearch
        ? productSearch.value.toLowerCase()
        : "";

    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "all";

    const filtered = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchText) ||
            product.description.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    productGrid.replaceChildren();

    if (noProducts) {
        noProducts.hidden = filtered.length !== 0;
    }

    filtered.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        const image = document.createElement("div");
        image.className = "product-image";
        image.textContent = product.icon;

        const info = document.createElement("div");
        info.className = "product-info";

        const category = document.createElement("span");
        category.className = "product-category";
        category.textContent = product.category.replace("-", " ");

        const title = document.createElement("h3");
        title.textContent = product.name;

        const description = document.createElement("p");
        description.textContent = product.description;

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = formatPrice(product.price);

        const footer = document.createElement("div");
        footer.className = "product-footer";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-primary";
        button.textContent = "Add to Cart";

        button.addEventListener("click", () => {
            addToCart(product.id);
        });

        footer.appendChild(button);
        info.append(category, title, description, price, footer);
        card.append(image, info);

        productGrid.appendChild(card);
    });
}

// 7. CART OPERATIONS

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);

    if (existing) {
        if (existing.quantity >= 20) {
            alert("Maximum quantity is 20 per product.");
            return;
        }

        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    displayCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    displayCart();
}

function displayCart() {
    if (!cartItems) return;

    cartItems.replaceChildren();

    if (cartCount) cartCount.textContent = getCartCount();

    const total = getCartTotal();

    if (cartSubtotal) cartSubtotal.textContent = formatPrice(total);
    if (cartTotal) cartTotal.textContent = formatPrice(total);

    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "Your cart is currently empty.";
        cartItems.appendChild(empty);
        return;
    }

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");

        const title = document.createElement("h4");
        title.textContent = item.name;

        const price = document.createElement("p");
        price.textContent =
            formatPrice(item.price) + " × " + item.quantity;

        details.append(title, price);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            removeFromCart(item.id);
        });

        row.append(details, removeButton);
        cartItems.appendChild(row);
    });
}

// 8. SEARCH AND FILTER

if (productSearch) {
    productSearch.addEventListener("input", displayProducts);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", displayProducts);
}

// 9. CHECKOUT NAVIGATION

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) return;

        document.getElementById("checkout")?.scrollIntoView({
            behavior: "smooth"
        });
    });
}

// 10. PAYMENT DETAILS

if (paymentMethod) {
    paymentMethod.addEventListener("change", () => {
        const method = paymentMethod.value;
        const wallet = PAYMENT_WALLETS[method];

        if (!wallet) {
            if (paymentDetails) paymentDetails.hidden = true;
            return;
        }

        if (paymentDetails) paymentDetails.hidden = false;

        if (paymentTitle) {
            paymentTitle.textContent = method + " Payment Information";
        }

        if (paymentNetwork) {
            paymentNetwork.textContent = "Network: " + wallet.network;
        }

        if (walletAddress) {
            walletAddress.textContent = wallet.address;
        }

        if (copyAddressBtn) {
            copyAddressBtn.disabled = !wallet.address;
        }
    });
}

// 11. COPY WALLET

if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", () => {
        const method = paymentMethod?.value;
        const address = PAYMENT_WALLETS[method]?.address;

        if (!address) return;

        copyText(address, copyAddressBtn, "Copy Address");
    });
}

// 12. PROFESSIONAL ORDER CONFIRMATION

function showOrderConfirmation(result) {
    if (!checkoutMessage) return;

    checkoutMessage.replaceChildren();

    const card = document.createElement("div");
    card.className = "order-success-card";

    const icon = document.createElement("div");
    icon.className = "success-icon";
    icon.textContent = "✓";

    const heading = document.createElement("h2");
    heading.textContent = "Order Submitted Successfully!";

    const description = document.createElement("p");
    description.textContent =
        "Thank you! Your order has been received and is awaiting review.";

    const info = document.createElement("div");
    info.className = "order-success-info";

    function addDetail(label, value, copyable = false) {
        const row = document.createElement("div");
        row.className = "order-success-row";

        const labelElement = document.createElement("strong");
        labelElement.textContent = label;

        const valueElement = document.createElement("span");
        valueElement.textContent = String(value ?? "N/A");

        row.append(labelElement, valueElement);

        if (copyable) {
            const copyButton = document.createElement("button");
            copyButton.type = "button";
            copyButton.className = "copy-order-button";
            copyButton.textContent = "Copy";

            copyButton.addEventListener("click", () => {
                copyText(value, copyButton, "Copy");
            });

            row.appendChild(copyButton);
        }

        info.appendChild(row);
    }

    addDetail("Order ID", result.orderId, true);
    addDetail("Access Code", result.accessCode, true);
    addDetail("Total Amount", formatPrice(result.total));
    addDetail("Payment Method", paymentMethod?.value || "N/A");
    addDetail("Order Status", "PENDING");

    const notice = document.createElement("p");
    notice.className = "order-save-notice";
    notice.textContent =
        "IMPORTANT: Save your Order ID and Access Code safely. You will need both to view your order details.";

    const trackingText = document.createElement("p");
    trackingText.textContent =
        "You can check your order anytime from the My Orders section.";

    card.append(
        icon,
        heading,
        description,
        info,
        notice,
        trackingText
    );

    checkoutMessage.appendChild(card);
    checkoutMessage.hidden = false;
    checkoutMessage.style.display = "block";
    checkoutMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// 13. SUBMIT ORDER

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!checkoutMessage || !placeOrderBtn) return;

        if (cart.length === 0) {
            checkoutMessage.textContent = "Your cart is empty.";
            checkoutMessage.hidden = false;
            return;
        }

        const name =
            document.getElementById("customerName")?.value.trim();

        const contact =
            document.getElementById("customerContact")?.value.trim();

        const method = paymentMethod?.value || "";

        const transactionId =
            document.getElementById("transactionId")?.value.trim() || "";

        if (!name || !contact || !method) {
            checkoutMessage.textContent =
                "Please complete all required fields.";
            checkoutMessage.hidden = false;
            return;
        }

        const wallet = PAYMENT_WALLETS[method];

        if (!wallet || !wallet.address) {
            checkoutMessage.textContent =
                "Payment wallet is not configured.";
            checkoutMessage.hidden = false;
            return;
        }

        const orderData = {
            name,
            contact,
            paymentMethod: method,
            transactionId,
            items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity
            }))
        };

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Submitting Order...";
        checkoutMessage.textContent = "Please wait...";
        checkoutMessage.hidden = false;

        try {
            const response = await fetch(WORKER_URL + "/order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || "Order submission failed."
                );
            }

            showOrderConfirmation({
                ...result,
                paymentMethod: method
            });

            cart = [];
            saveCart();
            displayCart();

            checkoutForm.reset();

            if (paymentDetails) {
                paymentDetails.hidden = true;
            }

        } catch (error) {
            checkoutMessage.textContent =
                "Could not submit your order: " + error.message;

            checkoutMessage.hidden = false;
            checkoutMessage.style.display = "block";

        } finally {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = "Submit Order";
        }
    });
}

// 14. MY ORDERS LOOKUP

if (orderLookupForm) {
    orderLookupForm.addEventListener("submit", async event => {
        event.preventDefault();

        const orderId = lookupOrderId.value.trim().toUpperCase();
        const accessCode = lookupAccessCode.value.trim().toUpperCase();

        orderLookupMessage.textContent = "";
        orderHistoryResult.hidden = true;
        orderHistoryResult.replaceChildren();

        if (!/^[A-F0-9]{8}$/.test(orderId)) {
            orderLookupMessage.textContent =
                "Please enter a valid 8-character Order ID.";
            return;
        }

        if (!/^[A-F0-9]{16}$/.test(accessCode)) {
            orderLookupMessage.textContent =
                "Please enter a valid 16-character Access Code.";
            return;
        }

        lookupOrderBtn.disabled = true;
        lookupOrderBtn.textContent = "Searching...";
        orderLookupMessage.textContent = "Finding your order...";

        try {
            const response = await fetch(WORKER_URL + "/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ orderId, accessCode })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error ||
                    "Order not found. Please check your details."
                );
            }

            const order = result.order;

            if (!order || typeof order !== "object") {
                throw new Error(
                    "Order information could not be displayed."
                );
            }

            const heading = document.createElement("h3");
            heading.textContent = "Order Details";

            const details = document.createElement("div");

            function addDetail(label, value) {
                const p = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = label + ": ";

                p.append(
                    strong,
                    document.createTextNode(String(value ?? "N/A"))
                );

                details.appendChild(p);
            }

            addDetail("Order ID", order.orderId);
            addDetail("Customer", order.customerName);
            addDetail("Contact", order.contact);
            addDetail("Total", formatPrice(order.total));
            addDetail("Payment Method", order.paymentMethod);
            addDetail("Order Status", order.orderStatus);

            if (order.createdAt) {
                const date = new Date(order.createdAt);

                addDetail(
                    "Order Date",
                    Number.isNaN(date.getTime())
                        ? order.createdAt
                        : date.toLocaleString()
                );
            }

            const productHeading = document.createElement("h4");
            productHeading.textContent = "Purchased Products";

            const productList = document.createElement("div");

            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const row = document.createElement("p");

                    row.textContent =
                        String(item.name || "Product") +
                        " × " +
                        Number(item.quantity || 0) +
                        " — " +
                        formatPrice(item.lineTotal);

                    productList.appendChild(row);
                });
            }

            orderHistoryResult.append(
                heading,
                details,
                productHeading,
                productList
            );

            orderHistoryResult.hidden = false;
            orderLookupMessage.textContent =
                "Order found successfully.";

        } catch (error) {
            orderLookupMessage.textContent =
                error.message || "Unable to retrieve your order.";

        } finally {
            lookupOrderBtn.disabled = false;
            lookupOrderBtn.textContent = "Find My Order";
        }
    });
}

// 15. ADMIN ORDER STATUS UPDATE

if (adminUpdateForm) {
    adminUpdateForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (
            !adminKey ||
            !adminOrderId ||
            !adminOrderStatus ||
            !adminUpdateBtn ||
            !adminUpdateMessage
        ) return;

        const password = adminKey.value;
        const orderId = adminOrderId.value.trim().toUpperCase();
        const status = adminOrderStatus.value;

        adminUpdateMessage.textContent = "";

        if (!password) {
            adminUpdateMessage.textContent =
                "Please enter Admin Password.";
            return;
        }

        if (!/^[A-F0-9]{8}$/.test(orderId)) {
            adminUpdateMessage.textContent =
                "Invalid Order ID. Enter an 8-character Order ID.";
            return;
        }

        if (!["PENDING", "COMPLETED"].includes(status)) {
            adminUpdateMessage.textContent =
                "Please select a valid Order Status.";
            return;
        }

        adminUpdateBtn.disabled = true;
        adminUpdateBtn.textContent = "Updating...";
        adminUpdateMessage.textContent = "Updating order status...";

        try {
            const response = await fetch(
                WORKER_URL + "/admin/order-status",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Admin-Key": password
                    },
                    body: JSON.stringify({
                        orderId,
                        orderStatus: status
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.error || "Status update failed."
                );
            }

            adminUpdateMessage.textContent =
                "SUCCESS! Order " + orderId +
                " is now " + status + ".";

            adminOrderId.value = "";
            adminOrderStatus.value = "";

        } catch (error) {
            adminUpdateMessage.textContent =
                error.message || "Unable to update order.";

        } finally {
            adminKey.value = "";
            adminUpdateBtn.disabled = false;
            adminUpdateBtn.textContent = "Update Order Status";
        }
    });
}

// 16. MOBILE NAVIGATION

if (menuBtn && navbar) {
    menuBtn.addEventListener("click", () => {
        navbar.classList.toggle("active");
    });

    document.querySelectorAll(".navbar a").forEach(link => {
        link.addEventListener("click", () => {
            navbar.classList.remove("active");
        });
    });
}

// 17. TELEGRAM CONTACT

if (telegramBtn) {
    telegramBtn.href = "https://t.me/" + TELEGRAM_USERNAME;
    telegramBtn.target = "_blank";
    telegramBtn.rel = "noopener noreferrer";
}

// 18. COPYRIGHT YEAR

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// 19. INITIALIZE

displayProducts();
displayCart();