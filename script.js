document.addEventListener("DOMContentLoaded", () => {
  const cartStorageKey = "greenHavenCartItems";
  const header = document.querySelector("header");
  const toast = document.createElement("div");
  toast.id = "toast";
  document.body.appendChild(toast);

  const cartToggle = document.createElement("button");
  cartToggle.type = "button";
  cartToggle.className = "cart-toggle";
  cartToggle.setAttribute("aria-label", "Open shopping cart");
  cartToggle.innerHTML = `
    <span class="cart-icon" aria-hidden="true">🛒</span>
    <span class="cart-label">Cart</span>
    <span id="cart-badge" aria-live="polite">0</span>
  `;

  const cartSidebar = document.createElement("aside");
  cartSidebar.id = "cart-sidebar";
  cartSidebar.innerHTML = `
    <div class="cart-sidebar__header">
      <div>
        <h3>Shopping Cart</h3>
        <p class="cart-sidebar__summary">Review your selected items</p>
      </div>
      <button type="button" class="cart-close" aria-label="Close cart">×</button>
    </div>
    <div class="cart-sidebar__body">
      <p class="empty-message">Your cart is empty.</p>
      <ul class="cart-items"></ul>
    </div>
    <div class="cart-sidebar__footer">
      <div class="cart-summary">
        <span>Items:</span>
        <strong class="cart-summary-count">0</strong>
      </div>
      <button type="button" class="cart-clear">Clear cart</button>
    </div>
  `;

  const cartBackdrop = document.createElement("div");
  cartBackdrop.id = "cart-backdrop";

  if (header) {
    header.appendChild(cartToggle);
  }
  document.body.appendChild(cartSidebar);
  document.body.appendChild(cartBackdrop);

  let cartItems = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");

  const getCartCount = () =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const saveCart = () => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  };

  const formatPrice = (priceText) => {
    const price = Number(priceText.replace(/[^\d.]/g, ""));
    return Number.isFinite(price) ? price : 0;
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 1800);
  };

  const updateCartBadge = () => {
    const cartBadge = document.getElementById("cart-badge");
    if (cartBadge) {
      cartBadge.textContent = getCartCount();
      cartBadge.setAttribute(
        "aria-label",
        `${getCartCount()} items in shopping cart`,
      );
    }
  };

  const renderCartItems = () => {
    const itemsContainer = cartSidebar.querySelector(".cart-items");
    const emptyMessage = cartSidebar.querySelector(".empty-message");
    const summaryCount = cartSidebar.querySelector(".cart-summary-count");

    if (!itemsContainer || !summaryCount || !emptyMessage) return;

    itemsContainer.innerHTML = "";
    if (cartItems.length === 0) {
      emptyMessage.style.display = "block";
    } else {
      emptyMessage.style.display = "none";
      cartItems.forEach((item) => {
        const itemElement = document.createElement("li");
        itemElement.className = "cart-item";
        itemElement.innerHTML = `
          <div class="cart-item__info">
            <strong>${item.name}</strong>
            <span>${item.quantity} × $${item.price.toFixed(2)}</span>
          </div>
          <button type="button" class="cart-item-remove" data-name="${item.name}" aria-label="Remove ${item.name}">×</button>
        `;
        itemsContainer.appendChild(itemElement);
      });
    }

    summaryCount.textContent = getCartCount();
  };

  const updateCartUI = () => {
    updateCartBadge();
    renderCartItems();
  };

  const addToCart = (productName, productPrice) => {
    const existingItem = cartItems.find((item) => item.name === productName);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({ name: productName, quantity: 1, price: productPrice });
    }
    saveCart();
    updateCartUI();
    showToast(`${productName} added to cart`);
  };

  const removeFromCart = (productName) => {
    cartItems = cartItems.filter((item) => item.name !== productName);
    saveCart();
    updateCartUI();
    showToast(`${productName} removed from cart`);
  };

  const clearCart = () => {
    cartItems = [];
    saveCart();
    updateCartUI();
    showToast("Cart cleared");
  };

  const toggleCartSidebar = (open) => {
    const isOpen =
      typeof open === "boolean"
        ? open
        : !cartSidebar.classList.contains("open");
    cartSidebar.classList.toggle("open", isOpen);
    cartBackdrop.classList.toggle("visible", isOpen);
    document.body.classList.toggle("cart-open", isOpen);
    if (isOpen) {
      cartSidebar.focus();
    }
  };

  const productButtons = document.querySelectorAll(".btn-cart, article button");
  productButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const article = button.closest("article");
      const productName =
        article?.querySelector("p")?.textContent?.trim() || "Product";
      const productPriceText =
        article?.querySelectorAll("p")[1]?.textContent || "0";
      const productPrice = formatPrice(productPriceText);
      addToCart(productName, productPrice);
    });
  });

  const cartClose = cartSidebar.querySelector(".cart-close");
  const cartClear = cartSidebar.querySelector(".cart-clear");

  cartToggle.addEventListener("click", () => toggleCartSidebar(true));
  cartClose?.addEventListener("click", () => toggleCartSidebar(false));
  cartBackdrop.addEventListener("click", () => toggleCartSidebar(false));
  cartClear?.addEventListener("click", clearCart);

  cartSidebar.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".cart-item-remove");
    if (removeButton) {
      const productName = removeButton.getAttribute("data-name");
      if (productName) removeFromCart(productName);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cartSidebar.classList.contains("open")) {
      toggleCartSidebar(false);
    }
  });

  const updateNavigation = () => {
    document.querySelectorAll("nav a").forEach((link) => {
      const isCurrentPage = link.href === window.location.href;
      if (isCurrentPage) {
        link.classList.add("active");
      }
    });

    document.querySelectorAll('a[href="#"]').forEach((link) => {
      link.addEventListener("click", (event) => event.preventDefault());
    });
  };

  const setupForm = () => {
    const form = document.querySelector("form");
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const requiredFields = form.querySelectorAll(
        "input[required], textarea[required], select[required]",
      );
      let isValid = true;

      requiredFields.forEach((field) => {
        if (!field.value.trim()) {
          field.classList.add("error");
          isValid = false;
        } else {
          field.classList.remove("error");
        }
      });

      if (!isValid) {
        showToast("Please fill all required fields");
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = "Sending...";
      }

      setTimeout(() => {
        form.reset();
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> Send Message';
        }
        showToast("Thanks! Your message was sent successfully");
      }, 1200);
    });
  };

  const revealOnScroll = () => {
    const revealElements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      },
    );

    revealElements.forEach((element) => observer.observe(element));
  };

  const updateFooterYear = () => {
    const footerYear = document.getElementById("footer-year");
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear();
    }
  };

  const init = () => {
    updateNavigation();
    setupForm();
    updateCartUI();
    revealOnScroll();
    updateFooterYear();
    window.addEventListener("scroll", () => {
      header?.classList.toggle("scrolled", window.scrollY > 30);
    });
  };

  init();
});
