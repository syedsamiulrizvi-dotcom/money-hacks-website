/* =====================================
   MONEY HACKS - STORE SYSTEM
   Products, Cart, Checkout & Telegram
===================================== */

// 1. CONFIGURATION

const WORKER_URL =
    "https://money-hacks-orders.syedsamiulrizvi.workers.dev";

const TELEGRAM_USERNAME = "MoneyHackTeams";

// Receiving wallet addresses
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
    {
        id: 1,
        name: "Digital Gift Card",
        category: "gift-cards",
        description: "Authorized digital gift card.",
        price: 10,
        icon: "🎁"
    },
    {
        id: 2,
        name: "Premium Gift Card",
        category: "gift-cards",
        description: "Genuine and authorized gift card.",
        price: 25,
        icon: "🎟️"
    },
    {
        id: 3,
        name: "Software License",
        category: "software",
        description: "Genuine software license.",
        price: 15,
        icon: "💻"
    },
    {
        id: 4,
        name: "Digital Resource Pack",
        category: "downloads",
        description: "Useful digital files and resources.",
        price: 8,
        icon: "📦"
    },
    {
        id: 5,
        name: "Premium Digital Bundle",
        category: "downloads",
        description: "Authorized digital downloads.",
        price: 20,
        icon: "⭐"
    },
    {
        id: 6,
        name: "Software Bundle",
        category: "software",
        description: "Authorized software products.",
        price: 30,
        icon: "🖥️"
    }
];

// 3. HTML ELEMENTS

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

// 4. CART SYSTEM

let cart = [];

function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
}

function getCartTotal() {
    return cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
    }, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => {
        return sum + item.quantity;
    }, 0);
}

// 5. DISPLAY PRODUCTS

function displayProducts() {
    if (!productGrid) return;

    const searchText = productSearch
        ? productSearch.value.toLowerCase()
        : "";

    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "all";

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchText) ||
            product.description.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    productGrid.innerHTML = "";

    if (noProducts) {
        noProducts.hidden = filteredProducts.length !== 0;
    }

    filteredProducts.forEach(product => {
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

        const addButton = document.createElement("button");
        addButton.className = "btn btn-primary";
        addButton.type = "button";
        addButton.textContent = "Add to Cart";

        addButton.addEventListener("click", () => {
            addToCart(product.id);
        });

        footer.appendChild(addButton);
        info.append(category, title, description, price, footer);
        card.append(image, info);

        productGrid.appendChild(card);
    });
}

// 6. ADD TO CART

function addToCart(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    displayCart();
}

// 7. REMOVE FROM CART

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    displayCart();
}

// 8. DISPLAY CART

function displayCart() {
    if (!cartItems) return;

    cartItems.innerHTML = "";

    if (cartCount) {
        cartCount.textContent = getCartCount();
    }

    const total = getCartTotal();

    if (cartSubtotal) {
        cartSubtotal.textContent = formatPrice(total);
    }

    if (cartTotal) {
        cartTotal.textContent = formatPrice(total);
    }

    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }

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

// 9. SEARCH AND CATEGORY FILTER

if (productSearch) {
    productSearch.addEventListener("input", displayProducts);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", displayProducts);
}

// 10. CHECKOUT NAVIGATION

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (cart.length === 0) return;

        const checkoutSection = document.getElementById("checkout");

        if (checkoutSection) {
            checkoutSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
}

// 11. PAYMENT DETAILS

if (paymentMethod) {
    paymentMethod.addEventListener("change", () => {
        const method = paymentMethod.value;

        if (!method) {
            if (paymentDetails) paymentDetails.hidden = true;
            return;
        }

        const wallet = PAYMENT_WALLETS[method];

        if (!wallet) {
            if (paymentDetails) paymentDetails.hidden = true;
            return;
        }

        if (paymentDetails) paymentDetails.hidden = false;

        if (paymentTitle) {
            paymentTitle.textContent =
                method + " Payment Information";
        }

        if (paymentNetwork) {
            paymentNetwork.textContent =
                "Network: " + wallet.network;
        }

        if (walletAddress) {
            walletAddress.textContent = wallet.address;
        }

        if (copyAddressBtn) {
            copyAddressBtn.disabled = !wallet.address;
        }
    });
}

// 12. COPY WALLET ADDRESS

if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", async () => {
        const method = paymentMethod
            ? paymentMethod.value
            : "";

        const address = PAYMENT_WALLETS[method]?.address;

        if (!address) return;

        try {
            await navigator.clipboard.writeText(address);

            copyAddressBtn.textContent = "Copied!";

            setTimeout(() => {
                copyAddressBtn.textContent = "Copy Address";
            }, 2000);

        } catch (error) {
            alert("Unable to copy. Please copy the address manually.");
        }
    });
}

// 13. SUBMIT ORDER TO CLOUDFLARE WORKER

if (checkoutForm) {
    checkoutForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!checkoutMessage || !placeOrderBtn) return;

        if (cart.length === 0) {
            checkoutMessage.textContent = "Your cart is empty.";
            return;
        }

        const name =
            document.getElementById("customerName").value.trim();

        const contact =
            document.getElementById("customerContact").value.trim();

        const method = paymentMethod
            ? paymentMethod.value
            : "";

        const transactionId =
            document.getElementById("transactionId").value.trim();

        if (!name || !contact || !method) {
            checkoutMessage.textContent =
                "Please complete all required fields.";
            return;
        }

        const wallet = PAYMENT_WALLETS[method];

        if (!wallet || !wallet.address) {
            checkoutMessage.textContent =
                "Payment wallet is not configured. Do not send payment.";
            return;
        }

        // Send only product IDs and quantities.
        // The Worker calculates the official prices and total.
        const orderData = {
            name: name,
            contact: contact,
            paymentMethod: method,
            transactionId: transactionId,
            items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity
            }))
        };

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Submitting Order...";
        checkoutMessage.textContent = "Please wait...";

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

            checkoutMessage.textContent =
                "Order submitted successfully! Order ID: " +
                result.orderId +
                " | Server-verified total: $" +
                Number(result.total).toFixed(2) +
                " | Payment status: PENDING. Please wait for manual verification.";

            cart = [];
            displayCart();
            checkoutForm.reset();

            if (paymentDetails) {
                paymentDetails.hidden = true;
            }

        } catch (error) {
            checkoutMessage.textContent =
                "Could not submit your order: " + error.message;

        } finally {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = "Submit Order";
        }
    });
}

// 14. MOBILE NAVIGATION

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

// 15. TELEGRAM CONTACT

if (telegramBtn) {
    telegramBtn.addEventListener("click", event => {
        if (TELEGRAM_USERNAME === "YOUR_TELEGRAM_USERNAME") {
            event.preventDefault();

            alert("Please configure your official Telegram username.");
            return;
        }

        telegramBtn.href =
            "https://t.me/" + TELEGRAM_USERNAME;

        telegramBtn.target = "_blank";
        telegramBtn.rel = "noopener noreferrer";
    });
}

// 16. COPYRIGHT YEAR

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// 17. INITIALIZE STORE

displayProducts();
displayCart();