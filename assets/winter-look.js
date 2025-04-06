document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.querySelector('.btn-start');
  const btnCheckout = document.querySelector('.btn-checkout');
  const selectButtons = document.querySelectorAll('.btn-select');
  const selectedCountElement = document.querySelector('.selected-count');
  const sections = document.querySelectorAll('.products-section');
  const totalSections = sections.length;
  
  // Store selected products
  const selectedProducts = {};

  // Add items to cart and redirect to checkout
  const addToCartAndCheckout = async () => {
    try {
      // Clear the cart first
      await fetch('/cart/clear.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Prepare items for cart
      const items = Object.values(selectedProducts).map(product => ({
        id: parseInt(product.variantId),
        quantity: 1
      }));

      // Add items to cart
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: items
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add items to cart');
      }

      // Get cart data to verify items were added
      const cartResponse = await fetch('/cart.js');
      const cartData = await cartResponse.json();
      
      if (cartData.item_count !== items.length) {
        throw new Error('Not all items were added to cart');
      }

      // Redirect to checkout
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Error adding items to cart:', error);
      alert('Sorry, there was an error adding items to your cart. Please try again.');
      throw error; // Re-throw to trigger error handling in click handler
    }
  };

  // Update selected count
  const updateSelectedCount = () => {
    const count = Object.keys(selectedProducts).length;
    selectedCountElement.textContent = count;
    btnCheckout.disabled = count !== totalSections;

    // Scroll to top if all products are selected
    if (count === totalSections) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 500);
    }
  };

  // Smooth scroll function
  const smoothScroll = (target) => {
    const element = document.querySelector(target);
    if (!element) return;
    
    const viewportHeight = window.innerHeight;
    const elementHeight = element.offsetHeight;
    const elementTop = element.getBoundingClientRect().top;
    const targetPosition = elementTop + window.pageYOffset - (viewportHeight - elementHeight) / 2;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Update active section
    sections.forEach(section => section.classList.remove('active'));
    element.classList.add('active');
  };

  // Handle start button click
  btnStart?.addEventListener('click', () => {
    smoothScroll('#step-1');
  });

  // Handle product selection
  selectButtons.forEach(button => {
    button.addEventListener('click', () => {
      const section = button.closest('.products-section');
      const sectionIndex = Array.from(sections).indexOf(section) + 1;
      const variantId = button.getAttribute('data-variant-id');
      const productId = button.getAttribute('data-product-id');
      
      // Deselect previously selected button in this section
      const sectionButtons = section.querySelectorAll('.btn-select');
      sectionButtons.forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
      });
      
      // Select current button
      button.classList.add('selected');
      selectedProducts[sectionIndex] = {
        variantId: variantId,
        productId: productId
      };
      
      // Disable other buttons in this section
      sectionButtons.forEach(btn => {
        if (btn !== button) {
          btn.disabled = true;
        }
      });
      
      // Update selected count and checkout button
      updateSelectedCount();
      
      // Scroll to next section if not the last section
      if (sectionIndex < totalSections) {
        setTimeout(() => {
          smoothScroll(`#step-${sectionIndex + 1}`);
        }, 500);
      }
    });
  });

  // Handle checkout button click
  btnCheckout?.addEventListener('click', () => {
    if (Object.keys(selectedProducts).length === totalSections) {
      // Show loading state
      btnCheckout.textContent = 'Processing...';
      btnCheckout.disabled = true;

      // Add to cart and redirect to checkout
      addToCartAndCheckout().catch(() => {
        // Reset button state if there's an error
        btnCheckout.textContent = 'CHECKOUT';
        btnCheckout.disabled = false;
      });
    }
  });
});
