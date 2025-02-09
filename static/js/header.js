// HEADER & PANTRY FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements
    const sidePanel = document.getElementById('side-panel');
    const pantryToggle = document.getElementById('pantry-toggle');
    const overlay = document.getElementById('overlay');
    const searchInput = document.getElementById('ingredient-search');
    const searchResults = document.getElementById('search-results');
    const categoriesContainer = document.getElementById('ingredient-categories');

    // Initialize pantry functionality only if elements exist
    if (sidePanel && pantryToggle && overlay) {
        // Pantry toggle functionality
        pantryToggle.addEventListener('click', () => {
            sidePanel.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidePanel.classList.remove('active');
            overlay.classList.remove('active');
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidePanel.contains(e.target) && !pantryToggle.contains(e.target)) {
                sidePanel.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    }

    // Search functionality setup
    if (searchInput && searchResults) {
        initializeFlattenedIngredients(); // Initialize the flattened array
        setupSearchFunctionality(searchInput, searchResults);

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // Load saved pantry items if the container exists
    const pantryContainer = document.getElementById('pantry-items');
    if (pantryContainer) {
        loadSavedPantryItems();
        if (categoriesContainer) {
            renderCategories(categoriesContainer);
        }
    }
});

// Create flattened ingredients array
let flattenedIngredients = [];

function initializeFlattenedIngredients() {
    if (typeof ingredientCategories !== 'undefined') {
        flattenedIngredients = Object.values(ingredientCategories)
            .flat()
            .sort();
    }
}

function setupSearchFunctionality(searchInput, searchResults) {
    // Initialize flattened ingredients first
    initializeFlattenedIngredients();

    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();

        // Clear results if search term is too short
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        // Filter ingredients
        const matchingIngredients = flattenedIngredients.filter(ingredient =>
            ingredient.toLowerCase().includes(searchTerm)
        );

        // Display results
        searchResults.innerHTML = '';
        if (matchingIngredients.length > 0) {
            matchingIngredients.forEach(ingredient => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = ingredient;
                div.onclick = () => {
                    managePantryItem(ingredient);
                    searchInput.value = '';
                    searchResults.style.display = 'none';
                };
                searchResults.appendChild(div);
            });
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    });
}

// Function to render categories and ingredients
function renderCategories(categoriesContainer) {
    if (!categoriesContainer || !ingredientCategories) return;

    categoriesContainer.innerHTML = '';

    Object.entries(ingredientCategories).forEach(([category, ingredients]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-section';

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <span>${category}</span>
            <span>▼</span>
        `;

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items';

        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';

        ingredients.forEach(ingredient => {
            const btn = document.createElement('button');
            btn.textContent = ingredient;
            btn.className = 'ingredient-btn';

            // Check if ingredient is in pantry and add selected class
            const pantryItems = document.getElementById('pantry-items');
            if (pantryItems && pantryItems.querySelector(`[data-ingredient="${ingredient}"]`)) {
                btn.classList.add('selected');
            }

            btn.onclick = () => managePantryItem(ingredient, btn);
            itemsGrid.appendChild(btn);
        });

        itemsContainer.appendChild(itemsGrid);

        // Toggle category expansion
        header.onclick = () => {
            itemsContainer.classList.toggle('active');
            header.querySelector('span:last-child').textContent =
                itemsContainer.classList.contains('active') ? '▲' : '▼';
        };

        categoryDiv.appendChild(header);
        categoryDiv.appendChild(itemsContainer);
        categoriesContainer.appendChild(categoryDiv);
    });
}

// Function to manage pantry items (add or remove)
function managePantryItem(ingredient, btn = null) {
    const pantryItems = document.getElementById('pantry-items');
    const existingItem = pantryItems.querySelector(`[data-ingredient="${ingredient}"]`);

    if (existingItem) {
        // Remove item if it exists
        existingItem.remove();
        if (btn) btn.classList.remove('selected');
    } else {
        // Add new item
        const item = document.createElement('div');
        item.className = 'pantry-item';
        item.setAttribute('data-ingredient', ingredient);

        const itemText = document.createElement('span');
        itemText.textContent = ingredient;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-item';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => {
            managePantryItem(ingredient);
            if (btn) btn.classList.remove('selected');
        };

        item.appendChild(itemText);
        item.appendChild(removeBtn);
        pantryItems.appendChild(item);

        if (btn) btn.classList.add('selected');
    }

    // Save pantry items after any change
    savePantryItems();
}

function clearPantryItems() {
    // Clear pantry items container
    const pantryItems = document.getElementById('pantry-items');
    if (pantryItems) {
        pantryItems.innerHTML = '';
    }

    // Reset ingredient buttons
    document.querySelectorAll('.ingredient-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Clear localStorage
    localStorage.removeItem('savedPantryItems');

    // Clear the pantryIngredients array if it exists
    if (typeof pantryIngredients !== 'undefined') {
        while (pantryIngredients.length) {
            pantryIngredients.pop();
        }
    }

    // Update recipe display if on recipe search page
    const recipeGrid = document.getElementById('recipeGrid');
    if (recipeGrid) {
        // Reset any existing filters
        currentSearchTerm = '';
        currentCategory = '';
        if (document.getElementById('recipe-search')) {
            document.getElementById('recipe-search').value = '';
        }
        if (document.getElementById('categoryFilter')) {
            document.getElementById('categoryFilter').value = '';
        }

        // Fetch and display all recipes
        if (typeof fetchRecipes === 'function') {
            fetchRecipes();
        }
    }
}

// Function to search for recipes based on pantry items
function searchRecipes() {
    const pantryItemsElements = document.getElementById('pantry-items').children;
    if (pantryItemsElements.length === 0) {
        alert('Please add some ingredients to your pantry first!');
        return;
    }

    const ingredientsList = Array.from(pantryItemsElements)
        .map(item => item.getAttribute('data-ingredient'))
        .join(',');

    // Redirect to recipe-search with ingredients as query parameters
    window.location.href = `/recipe-search?ingredients=${encodeURIComponent(ingredientsList)}`;
}

// Save pantry items to localStorage
function savePantryItems() {
    const pantryItemsArray = Array.from(document.getElementById('pantry-items').children)
        .map(item => item.getAttribute('data-ingredient'));
    localStorage.setItem('savedPantryItems', JSON.stringify(pantryItemsArray));
}

// Load pantry items from localStorage
function loadSavedPantryItems() {
    const savedItems = localStorage.getItem('savedPantryItems');
    if (savedItems) {
        const items = JSON.parse(savedItems);
        items.forEach(ingredient => managePantryItem(ingredient));

        // Update the visual selection state of ingredient buttons
        document.querySelectorAll('.ingredient-btn').forEach(btn => {
            if (items.includes(btn.textContent)) {
                btn.classList.add('selected');
            }
        });
    }
}