import './style.css';
import { ProductDatabase } from './database';
import type { Product } from './product.interface';

// @ts-ignore
import productsData from '../data.json';

const db = new ProductDatabase();

async function getProducts() {
  const products: Product[] = productsData.map((item: any, index: number) => ({
    id: index + 1,
    individual_price: item.price,
    item_count: 0,
    items_seleced: 0,
    name: item.name,
    category: item.category,
    image: item.image?.desktop || '',
  }));
  // Only add products that don't already exist in IndexedDB
  const existing = await db.getProducts();
  if (existing.length === 0) {
    for (const product of products) {
      await db.addProduct(product);
    }
  }
}

function getResponsiveImage(imageObj: any) {
  return `
    <picture>
      <source media="(max-width: 600px)" srcset="${imageObj.mobile}">
      <source media="(max-width: 900px)" srcset="${imageObj.tablet}">
      <img src="${imageObj.desktop}" alt="dessert image" class="dessert-image">
    </picture>
  `;
}

function renderProducts(products: Product[]) {
  return products.map(product => {
    const inCart = product.items_seleced && product.items_seleced > 0;
    return `
      <div class="card" data-id="${product.id}">
        ${getResponsiveImage(productsData[product.id - 1].image)}
        <div class="add-to-cart">
          ${inCart ? `
            <div class="quantity-circle active">
              <button class="decrement-btn" data-id="${product.id}"><img src="/images/icon-decrement-quantity.svg" alt="-" /></button>
              <span class="item-count">${product.items_seleced}</span>
              <button class="increment-btn" data-id="${product.id}"><img src="/images/icon-increment-quantity.svg" alt="+" /></button>
            </div>
          ` : `
            <button class="add-to-cart-btn" data-id="${product.id}"><img src="/images/icon-add-to-cart.svg" class="big">Add to cart</button>
          `}
        </div>
        <div class="dessert-info">
        <h3 class="dessert-name">${product.category}</h3><br>
        ${product.name}<br>
        <span class="price">$${product.individual_price.toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function main() {
  // Seed only if empty
  if ((await db.getProducts()).length === 0) {
    await getProducts();
  }
  await renderAndBind();
}

async function renderAndBind() {
  const products = await db.getProducts();
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="main">
    <div class ="mid">
    <div class="header">
      <h1>Desserts</h1>
    </div>
      <div class="container">
        ${renderProducts(products)}
      </div>
      </div>
      <aside class="cart">
        <div class="cart-header">
          <h2>Your Cart</h2>
          <p id="item-count">0</p>
        </div>
        <div class="selected-items"></div>
        <button class="checkout">Confirm Order</button>
      </aside>
      <div id="order-popup" class="order-popup hidden"></div>
    </div>
  `;

  // Add to cart
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
      const product = await db.getProductById(id);
      if (product) {
        product.items_seleced = 1;
        await db.updateProduct(product);
        await renderAndBind();
        updateCart();
      }
    });
  });
  // Increment
  document.querySelectorAll('.increment-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
      const product = await db.getProductById(id);
      if (product) {
        product.items_seleced = (product.items_seleced || 0) + 1;
        await db.updateProduct(product);
        await renderAndBind();
        updateCart();
      }
    });
  });
  // Decrement
  document.querySelectorAll('.decrement-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
      const product = await db.getProductById(id);
      if (product && product.items_seleced && product.items_seleced > 0) {
        product.items_seleced = product.items_seleced - 1;
        await db.updateProduct(product);
        await renderAndBind();
        updateCart();
      }
    });
  });
  updateCart();

  // Confirm Order popup logic
  const checkoutBtn = document.querySelector<HTMLButtonElement>('.checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const products = await db.getProducts();
      const selected = products.filter(p => p.items_seleced && p.items_seleced > 0);
      const total = selected.reduce((sum, p) => sum + (p.individual_price * (p.items_seleced || 0)), 0);
      const popup = document.getElementById('order-popup');
      if (popup) {
        popup.innerHTML = `
          <div class="order-popup-content">
          <img src="/images/icon-order-confirmed.svg">
            <h2 class="order-popup-title">Order Confirmed</h2>
            <div class="order-popup-details">
              ${selected.length ? selected.map(p => `
                <div class="order-popup-item" style="display: flex; align-items: center; justify-content: space-between; gap: 0.7rem;">
                  <img src="${productsData[p.id - 1].image.thumbnail}" alt="${p.name}" style="width: 3.5rem; height: 3.5rem; border-radius: 0.5rem; object-fit: cover; margin-right: 0.7rem;">
                  <div style="flex:1; min-width:0;">
                    <div class="order-popup-item-name" style="font-weight: 500;">${p.name}</div>
                    <span class="order-popup-item-qty" style="color: hsl(14, 86%, 42%); margin-right: 0.5rem;">${p.items_seleced}x</span>
                    <span style="font-size: 0.98em; color: #888;">$${p.individual_price.toFixed(2)} </span>
                  </div>
                  <div style="text-align: right;">
                    <span class="order-popup-item-price" style="font-weight: 600; color: black;">$${(p.individual_price * (p.items_seleced || 0)).toFixed(2)}</span>
                  </div>
                </div>
              `).join('<hr style=\"margin:0.5rem 0;\">') : '<div>No items in order.</div>'}
            </div>
            <div class="order-popup-total" style="width:100%;  border-top:1px solid #eee; padding-top:1rem; margin-top:1rem; font-size:1.15rem; font-weight:700; color:black;">Order Total <span style="margin-left:200px">$${total.toFixed(2)}</span></div>
            <button class="order-popup-new">Start New Order</button>
          </div>
        `;
        popup.classList.remove('hidden');
        document.body.classList.add('popup-open');
        // Start New Order button logic
        popup.querySelector('.order-popup-new')!.addEventListener('click', async () => {
          for (const p of selected) {
            p.items_seleced = 0;
            await db.updateProduct(p);
          }
          popup.classList.add('hidden');
          document.body.classList.remove('popup-open');
          await renderAndBind();
          updateCart();
        });
      }
    });
  }
}

async function updateCart() {
  const products = await db.getProducts();
  const selected = products.filter(p => p.items_seleced && p.items_seleced > 0);
  const itemCount = selected.reduce((sum, p) => sum + (p.items_seleced || 0), 0);
  // Show item count in red, in brackets, in the same line as h2
  document.getElementById('item-count')!.innerHTML = `<span style="color: hsl(14, 86%, 42%);">(${itemCount})</span>`;
  document.querySelector('.selected-items')!.innerHTML = selected.length
    ? selected.map((p, i) => `
        <div>
          <span style="width:100%; color:hsl(14, 65%, 9%);font-weight:600">${p.name}</span><br>
          <span style="color:red "><b>${p.items_seleced} x</b></span>
          <span style="color:gray; margin:5px">@$${p.individual_price.toFixed(2)}</span>
          <span style="margin-left:3px; color:hsl(12, 20%, 44%); font-weight:bold; margin-right:1px;">
            $${(p.individual_price * (p.items_seleced || 0)).toFixed(2)}
          </span>
          <button class="remove-item" data-id="${p.id}">
            <img src="/images/icon-remove-item.svg">
          </button>
        </div>
        ${i < selected.length - 1 ? '<hr style="margin:8px 0;">' : ''}
      `).join('') +
      `<div style="margin-top:16px; text-align:right; font-size:1.1em; color:black;"><hr style="margin:8px 0;">
        Order Total<span > $${selected.reduce((sum, p) => sum + (p.individual_price * (p.items_seleced || 0)), 0).toFixed(2)}</span> 

      </div>` +
        `<div style="background-color: hsl(13, 31%, 94%); justify-content: center; align-items: center; padding: 8px; margin-top: 16px;margin-bottom:16px;padding:10px; border-radius: 8px; ">
        <img src="/images/icon-carbon-neutral.svg" >
        This is a &nbsp<b> carbon-neutral </b>&nbsp delivery
        </div>`
    : `<div class="empty-cart-illustration"><img src="/images/illustration-empty-cart.svg" alt="Empty cart" /><p>Your cart is empty.</p></div>`;
  const checkoutBtn = document.querySelector<HTMLButtonElement>('.checkout');
  if (checkoutBtn) {
    checkoutBtn.style.display = selected.length ? 'block' : 'none';
  }
  // Remove item event
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
      const product = await db.getProductById(id);
      if (product) {
        product.items_seleced = 0;
        await db.updateProduct(product);
        await renderAndBind(); // Ensure UI updates to show add-to-cart button
        updateCart();
      }
    });
  });
}

main().catch(console.error);

