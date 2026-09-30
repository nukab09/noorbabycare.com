"use strict";
window.NoorCart = {
  sanitize(value, products) {
    if (!Array.isArray(value)) return [];
    const result = [];
    value.slice(0,100).forEach(item => {
      if (!item || typeof item !== "object") return;
      const product = products.find(p => p.id === item.id);
      if (!product || !product.options.includes(item.option)
          || !Number.isInteger(item.quantity) || item.quantity < 1
          || item.quantity > 99) return;
      const existing = result.find(x => x.id === item.id && x.option === item.option);
      if (existing) existing.quantity = Math.min(99,existing.quantity + item.quantity);
      else result.push({id:item.id,option:item.option,quantity:item.quantity});
    });
    return result;
  },
  subtotal(cart, products) {
    return cart.reduce((total,item) => {
      const product = products.find(p => p.id === item.id);
      return total + (product ? product.demoPrice * item.quantity : 0);
    },0);
  },
  deliveryRange(subtotal, area) {
    return area === "dhaka" ? [subtotal + 70,subtotal + 70] : [subtotal + 150,subtotal + 200];
  }
};
