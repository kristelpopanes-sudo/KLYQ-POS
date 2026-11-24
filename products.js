
const GPS_PRODUCT_KEY = "gps_products";
const GPS_ACTIVITY_KEY = "gps_activity_logs";

// Shared activity history stored in this browser.
function logGPSActivity(action, details, actor) {
    try {
        const logs = JSON.parse(localStorage.getItem(GPS_ACTIVITY_KEY) || "[]");
        const user = actor || JSON.parse(localStorage.getItem("currentUser") || "null") || {};
        logs.push({
            id: "LOG-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
            action: String(action || "Activity"),
            details: String(details || ""),
            user: user.name || user.fullName || user.username || "Unknown user",
            role: user.role || "Unknown",
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        });
        localStorage.setItem(GPS_ACTIVITY_KEY, JSON.stringify(logs.slice(-1000)));
        window.dispatchEvent(new CustomEvent("gpsActivityUpdated"));
        return true;
    } catch (error) {
        console.error("Activity log error:", error);
        return false;
    }
}

function getGPSActivityLogs() {
    try {
        const logs = JSON.parse(localStorage.getItem(GPS_ACTIVITY_KEY) || "[]");
        return Array.isArray(logs) ? logs : [];
    } catch (error) { return []; }
}

// GET PRODUCTS
function getGPSProducts() {
    try {
        const products = JSON.parse(
            localStorage.getItem(GPS_PRODUCT_KEY) || "[]"
        );

        return Array.isArray(products) ? products : [];

    } catch (error) {
        console.error("Loading error:", error);
        return [];
    }
}

// SAVE PRODUCTS
function saveGPSProducts(products) {

    if (!Array.isArray(products)) return false;

    try {
        localStorage.setItem(
            GPS_PRODUCT_KEY,
            JSON.stringify(products)
        );

        window.dispatchEvent(
            new CustomEvent("gpsProductsUpdated", {
                detail: products
            })
        );

        return true;

    } catch (error) {
        console.error("Saving error:", error);
        alert("Unable to save products!");
        return false;
    }
}

// ADD PRODUCT
function addGPSProduct(name, price, stock, expirationDate = "", restockLevel = 5) {

    const products = getGPSProducts();

    name = String(name ?? "").trim();
    price = Number(price);
    stock = Number(stock);

    if (
        !name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        alert("Please enter valid product information!");
        return false;
    }

    const duplicate = products.some(product =>
        String(product.name).trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        alert("Product already exists!");
        return false;
    }

    const newProduct = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        name: name,
        price: price,
        stock: stock,
        expirationDate: expirationDate || "",
        restockLevel: Number.isInteger(Number(restockLevel)) && Number(restockLevel) >= 0 ? Number(restockLevel) : 5
    };

    products.push(newProduct);

    if (!saveGPSProducts(products)) {
        return false;
    }
    logGPSActivity("Product added", `${name} added with ${stock} item(s).`);
    return newProduct;
}

// UPDATE PRODUCT
function updateGPSProduct(id, updatedData) {

    const products = getGPSProducts();

    const index = products.findIndex(
        product => String(product.id) === String(id)
    );

    if (index === -1) return false;

    const name = String(updatedData.name ?? "").trim();
    const price = Number(updatedData.price);
    const stock = Number(updatedData.stock);

    if (
        !name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        alert("Invalid product information!");
        return false;
    }

    const duplicate = products.some((product, i) =>
        i !== index &&
        String(product.name).trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
        alert("Product name already exists!");
        return false;
    }

    products[index] = {
        ...products[index],
        name: name,
        price: price,
        stock: stock,
        expirationDate: updatedData.expirationDate ?? products[index].expirationDate ?? "",
        restockLevel: Number.isInteger(Number(updatedData.restockLevel)) && Number(updatedData.restockLevel) >= 0
            ? Number(updatedData.restockLevel) : (products[index].restockLevel ?? 5)
    };

    const saved = saveGPSProducts(products);
    if (saved) logGPSActivity("Product updated", `${name} product information was updated.`);
    return saved;
}

// DELETE PRODUCT
function deleteGPSProduct(id) {

    const products = getGPSProducts();

    const updatedProducts = products.filter(
        product => String(product.id) !== String(id)
    );

    if (updatedProducts.length === products.length) {
        return false;
    }

    const deleted = products.find(product => String(product.id) === String(id));
    const saved = saveGPSProducts(updatedProducts);
    if (saved && deleted) logGPSActivity("Product deleted", `${deleted.name} was removed from the product list.`);
    return saved;
}

// LISTEN FOR CHANGES
function onGPSProductsChanged(callback) {

    window.addEventListener("gpsProductsUpdated", function() {
        callback(getGPSProducts());
    });

    window.addEventListener("storage", function(event) {

        if (event.key === GPS_PRODUCT_KEY) {
            callback(getGPSProducts());
        }

    });
}
