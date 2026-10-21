
"use strict";

// ======================================
// 1. DESTINATION DATA
// ======================================

const destinations = [
    {
        id: 1,
        name: "Paris",
        country: "France",
        category: "City",
        image: "paris.jpg.png",
        rating: 4.9,
        dailyEstimate: { food: 65, localTransport: 18, activities: 42 },
        hotelRates: { budget: 110, standard: 190, premium: 380 },
        carMultiplier: 1.35,
        description:
            "Discover charming streets, iconic landmarks, cozy cafes and unforgettable Parisian experiences.",
        bestTime: "April - October",
        temperature: "18°C average",
        duration: "5-7 days",
        experiences: [
            "Eiffel Tower",
            "Louvre Museum",
            "Seine River",
            "Montmartre"
        ]
    },
    {
        id: 2,
        name: "Bali",
        country: "Indonesia",
        category: "Beach",
        image: "bali.jpg.png",
        rating: 4.8,
        dailyEstimate: { food: 32, localTransport: 12, activities: 28 },
        hotelRates: { budget: 55, standard: 115, premium: 280 },
        carMultiplier: 0.8,
        description:
            "Relax on tropical beaches, explore beautiful rice terraces and experience the culture of Bali.",
        bestTime: "April - October",
        temperature: "27°C average",
        duration: "5-7 days",
        experiences: [
            "Beach sunsets",
            "Temple visits",
            "Rice terraces",
            "Waterfalls"
        ]
    },
    {
        id: 3,
        name: "Santorini",
        country: "Greece",
        category: "Nature",
        image: "santorino.jpg.png",
        rating: 4.9,
        dailyEstimate: { food: 55, localTransport: 16, activities: 38 },
        hotelRates: { budget: 95, standard: 175, premium: 360 },
        carMultiplier: 1.15,
        description:
            "Enjoy whitewashed buildings, blue domes, beautiful sunsets and Mediterranean sea views.",
        bestTime: "May - September",
        temperature: "24°C average",
        duration: "3-5 days",
        experiences: [
            "Oia sunset",
            "Blue dome churches",
            "Coastal walks",
            "Local cuisine"
        ]
    },
    {
        id: 4,
        name: "Swiss Alps",
        country: "Switzerland",
        category: "Mountain",
        image: "swiss-alps.jpg.png",
        rating: 4.9,
        dailyEstimate: { food: 75, localTransport: 30, activities: 55 },
        hotelRates: { budget: 130, standard: 230, premium: 460 },
        carMultiplier: 1.5,
        description:
            "Discover dramatic mountain peaks, peaceful valleys, alpine villages and scenic hiking trails.",
        bestTime: "June - September",
        temperature: "15°C average",
        duration: "5-8 days",
        experiences: [
            "Mountain railways",
            "Scenic hikes",
            "Alpine villages",
            "Lake views"
        ]
    },
    {
        id: 5,
        name: "Tokyo",
        country: "Japan",
        category: "City",
        image: "tokyo.jpg.png",
        rating: 4.8,
        dailyEstimate: { food: 48, localTransport: 15, activities: 32 },
        hotelRates: { budget: 85, standard: 155, premium: 330 },
        carMultiplier: 1.1,
        description:
            "Experience a fascinating mix of modern city life, traditional temples, gardens and Japanese food.",
        bestTime: "March - May",
        temperature: "17°C average",
        duration: "5-7 days",
        experiences: [
            "Shibuya Crossing",
            "Senso-ji Temple",
            "Shinjuku",
            "Japanese cuisine"
        ]
    }
];


// ======================================
// 2. DOM ELEMENTS AND APP STATE
// ======================================

const destinationGrid =
    document.getElementById("destinationGrid");

const searchInput =
    document.getElementById("searchInput");

const categoryButtons =
    document.querySelectorAll(".category-button");

const resultsLabel =
    document.getElementById("resultsLabel");

const favoriteCount =
    document.getElementById("favoriteCount");

const favoritesToggle =
    document.getElementById("favoritesToggle");

const themeToggle =
    document.getElementById("themeToggle");

const detailsModal =
    document.getElementById("detailsModal");

const plannerModal =
    document.getElementById("plannerModal");

const planDetailsModal =
    document.getElementById("planDetailsModal");

const tripForm =
    document.getElementById("tripForm");

const toast =
    document.getElementById("toast");

const plannedTrips =
    document.getElementById("plannedTrips");

const tripCount =
    document.getElementById("tripCount");

const tripReminder =
    document.getElementById("tripReminder");

const enableReminders =
    document.getElementById("enableReminders");

let selectedCategory = "All";
let favoritesOnly = false;
let currentDestination = null;
let editingPlanId = null;
let activePlanId = null;
let previousFocus = null;
let toastTimeout;


// Read saved information safely.
function readStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        return saved === null
            ? fallback
            : JSON.parse(saved);
    } catch {
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        showToast("Browser storage is unavailable.");
        return false;
    }
}

let favorites = readStorage("travelora-favorites", []);

if (!Array.isArray(favorites)) {
    favorites = [];
}

let savedPlans = readStorage("travelora-plans", []);

if (!Array.isArray(savedPlans)) {
    savedPlans = [];
}

savedPlans = savedPlans.map(migratePlan).filter(Boolean);


// ======================================
// 3. TOAST NOTIFICATION
// ======================================

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function getDaysUntilTrip(date) {
    const [year, month, day] = date.split("-").map(Number);

    if (!year || !month || !day) return null;

    const now = new Date();
    const todayUtc = Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
    const tripUtc = Date.UTC(year, month - 1, day);

    return Math.round((tripUtc - todayUtc) / 86400000);
}

function formatTripDate(date) {
    const [year, month, day] = date.split("-").map(Number);

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "long"
    }).format(new Date(year, month - 1, day));
}

function getTripNights(departureDate, returnDate) {
    const departure = Date.parse(`${departureDate}T00:00:00Z`);
    const returning = Date.parse(`${returnDate}T00:00:00Z`);

    if (!Number.isFinite(departure) || !Number.isFinite(returning)) {
        return 0;
    }

    return Math.max(0, Math.round((returning - departure) / 86400000));
}

function addDaysToDate(date, days) {
    const [year, month, day] = date.split("-").map(Number);
    const result = new Date(year, month - 1, day);
    result.setDate(result.getDate() + days);

    return [
        result.getFullYear(),
        String(result.getMonth() + 1).padStart(2, "0"),
        String(result.getDate()).padStart(2, "0")
    ].join("-");
}

function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(amount);
}

function calculatePlanCosts(plan) {
    const destination = destinations.find(
        item => item.id === Number(plan.destinationId)
    );

    if (!destination) return null;

    const nights = getTripNights(plan.departureDate, plan.returnDate);
    const days = nights + 1;
    const travelers = Math.max(1, Number(plan.travelers) || 1);
    const hotelRates = destination.hotelRates;
    const hotelRate = hotelRates[plan.hotelCategory] || hotelRates.standard;
    const carRates = { economy: 42, comfort: 68, suv: 105 };
    const carMultiplier = destination.carMultiplier;
    const daily = destination.dailyEstimate;
    const costs = {
        hotel: plan.hotelIncluded ? hotelRate * nights : 0,
        car: plan.carIncluded
            ? Math.round(carRates[plan.carCategory] * carMultiplier) * nights
            : 0,
        food: daily.food * travelers * days,
        localTransport: daily.localTransport * travelers * days,
        activities: daily.activities * travelers * days
    };

    costs.total = Object.values(costs).reduce(
        (total, amount) => total + amount,
        0
    );

    return { days, nights, travelers, costs };
}

function migratePlan(plan) {
    if (!plan || typeof plan !== "object") return null;

    const originalDestination = destinations.find(
        item => item.id === Number(plan.destinationId)
    );
    const legacyDestination = destinations.find(item =>
        String(plan.destination || "").startsWith(item.name)
    );
    const destination = originalDestination || legacyDestination;
    const departureDate = plan.departureDate || plan.date;

    if (!destination || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate || "")) {
        return null;
    }

    const returnDate = plan.returnDate &&
        getTripNights(departureDate, plan.returnDate) > 0
        ? plan.returnDate
        : addDaysToDate(departureDate, 5);

    const migrated = {
        ...plan,
        id: plan.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        destinationId: destination.id,
        destination: `${destination.name}, ${destination.country}`,
        departureDate,
        returnDate,
        travelers: Math.max(1, Number(plan.travelers) || 1),
        hotelIncluded: Boolean(plan.hotelIncluded),
        hotelCategory: plan.hotelCategory || "standard",
        carIncluded: Boolean(plan.carIncluded),
        carCategory: plan.carCategory || "comfort",
        notes: typeof plan.notes === "string" ? plan.notes : ""
    };

    const estimate = calculatePlanCosts(migrated);

    return estimate
        ? { ...migrated, costs: estimate.costs }
        : null;
}

function renderPlannedTrips() {
    plannedTrips.replaceChildren();
    tripCount.textContent = savedPlans.length;

    if (savedPlans.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "planned-trips-empty";

        const heading = document.createElement("h3");
        heading.textContent = "No trips planned yet";

        const message = document.createElement("p");
        message.textContent =
            "Explore a destination and choose “Plan this trip” to save your first adventure.";

        emptyState.append(heading, message);
        plannedTrips.appendChild(emptyState);
        return;
    }

    savedPlans
        .slice()
        .sort((first, second) =>
            first.departureDate.localeCompare(second.departureDate)
        )
        .forEach(plan => {
            const card = document.createElement("article");
            card.className = "planned-trip-card";

            const image = document.createElement("img");
            const destination = destinations.find(
                item => item.id === Number(plan.destinationId)
            );
            image.className = "planned-trip-image";
            image.src = destination.image;
            image.alt = `${destination.name}, ${destination.country}`;
            image.loading = "lazy";

            const content = document.createElement("div");
            content.className = "planned-trip-content";

            const heading = document.createElement("h3");
            heading.textContent = plan.destination;

            const traveler = document.createElement("p");
            traveler.textContent = `Planned by ${plan.name}`;

            const dates = document.createElement("p");
            dates.className = "planned-trip-date";
            dates.textContent =
                `${formatTripDate(plan.departureDate)} – ${formatTripDate(plan.returnDate)}`;

            const duration = document.createElement("p");
            const nights = getTripNights(
                plan.departureDate,
                plan.returnDate
            );
            duration.textContent =
                `${nights + 1} days · ${nights} ${nights === 1 ? "night" : "nights"} · ${plan.travelers} ${plan.travelers === 1 ? "traveler" : "travelers"}`;

            const daysUntil = getDaysUntilTrip(plan.departureDate);
            const countdown = document.createElement("span");
            countdown.className = "trip-countdown";

            if (daysUntil === 0) {
                countdown.textContent = "Your trip is today";
            } else if (daysUntil > 0) {
                countdown.textContent =
                    `${daysUntil} ${daysUntil === 1 ? "day" : "days"} to go`;
            } else {
                countdown.textContent = "Departure date has passed";
            }

            const cost = document.createElement("div");
            cost.className = "planned-trip-costs";

            const hotelCost = document.createElement("span");
            hotelCost.textContent = plan.hotelIncluded
                ? `Hotel · ${formatCurrency(plan.costs.hotel)}`
                : "No hotel";

            const carCost = document.createElement("span");
            carCost.textContent = plan.carIncluded
                ? `Rental car · ${formatCurrency(plan.costs.car)}`
                : "No rental car";

            const otherCosts = document.createElement("span");
            otherCosts.textContent =
                `Food, local travel & activities · ${formatCurrency(plan.costs.food + plan.costs.localTransport + plan.costs.activities)}`;

            const total = document.createElement("strong");
            total.textContent =
                `Estimated total · ${formatCurrency(plan.costs.total)}`;

            cost.append(hotelCost, carCost, otherCosts, total);

            const actions = document.createElement("div");
            actions.className = "planned-trip-actions";

            [
                ["Show Plan", "show"],
                ["Edit", "edit"],
                ["Delete", "delete"]
            ].forEach(([label, action]) => {
                const button = document.createElement("button");
                button.className = action === "show"
                    ? "primary-button"
                    : "secondary-action";
                button.type = "button";
                button.dataset.tripId = String(plan.id);
                button.dataset.tripAction = action;
                button.textContent = label;
                actions.appendChild(button);
            });

            content.append(
                heading,
                traveler,
                dates,
                duration,
                countdown,
                cost,
                actions
            );
            card.append(image, content);
            plannedTrips.appendChild(card);
        });
}

function updateTripReminder() {
    const upcomingTrips = savedPlans
        .map(plan => ({
            plan,
            daysUntil: getDaysUntilTrip(plan.departureDate)
        }))
        .filter(item =>
            item.daysUntil !== null &&
            item.daysUntil >= 0 &&
            item.daysUntil <= 7
        )
        .sort((first, second) => first.daysUntil - second.daysUntil);

    if (upcomingTrips.length === 0) {
        tripReminder.hidden = true;
        return;
    }

    const { plan, daysUntil } = upcomingTrips[0];
    document.getElementById("reminderTitle").textContent =
        daysUntil === 0
            ? `Your trip to ${plan.destination} is today!`
            : `Your trip to ${plan.destination} is coming up!`;

    document.getElementById("reminderMessage").textContent =
        daysUntil === 0
            ? `Safe travels, ${plan.name}. Your trip is scheduled for today.`
            : `Just ${daysUntil} ${daysUntil === 1 ? "day" : "days"} until your trip. Time to get ready, ${plan.name}!`;

    tripReminder.hidden = false;

    if (typeof Notification === "undefined" ||
        Notification.permission !== "granted") {
        return;
    }

    let sentNewReminder = false;

    upcomingTrips.forEach(({ plan: upcomingPlan, daysUntil: remaining }) => {
        if (upcomingPlan.reminderSent) return;

        try {
            new Notification(`Your trip to ${upcomingPlan.destination} is near!`, {
                body: remaining === 0
                    ? "Your trip is today. Have a wonderful journey!"
                    : `Your trip starts in ${remaining} ${remaining === 1 ? "day" : "days"}.`,
                tag: `travelora-trip-${upcomingPlan.id}`
            });

            upcomingPlan.reminderSent = true;
            sentNewReminder = true;
        } catch {
            showToast("Could not show a browser notification. Your in-app reminder is still available.");
        }
    });

    if (sentNewReminder) {
        saveStorage("travelora-plans", savedPlans);
    }
}

enableReminders.addEventListener("click", async () => {
    if (typeof Notification === "undefined") {
        showToast("Browser notifications are not supported here. In-app reminders will still appear.");
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            enableReminders.textContent = "Browser reminders enabled";
            updateTripReminder();
            showToast("Browser reminders enabled.");
        } else {
            showToast("Notifications were not enabled. In-app reminders will still appear.");
        }
    } catch {
        showToast("Could not enable browser notifications. In-app reminders will still appear.");
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateTripReminder();
});

function refreshTripDashboard() {
    renderPlannedTrips();
    updateTripReminder();
}

window.addEventListener("focus", refreshTripDashboard);
setInterval(refreshTripDashboard, 60 * 60 * 1000);

function scheduleMidnightRefresh() {
    const now = new Date();
    const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );

    setTimeout(() => {
        refreshTripDashboard();
        scheduleMidnightRefresh();
    }, midnight.getTime() - now.getTime());
}

scheduleMidnightRefresh();


// ======================================
// 4. DESTINATION CARDS
// ======================================

function displayDestinations(list) {
    destinationGrid.replaceChildren();

    resultsLabel.textContent =
        `${list.length} ${list.length === 1 ? "destination" : "destinations"} found`;

    if (list.length === 0) {
        const emptyState = document.createElement("div");

        emptyState.className = "no-results";

        const heading = document.createElement("h3");
        heading.textContent = favoritesOnly
            ? "No favorites yet"
            : "No destinations found";

        const paragraph = document.createElement("p");
        paragraph.textContent = favoritesOnly
            ? "Tap the heart on a destination to save it here."
            : "Try a different search or category.";

        emptyState.append(heading, paragraph);
        destinationGrid.appendChild(emptyState);

        return;
    }

    list.forEach((destination, index) => {
        const card = document.createElement("article");

        card.className = "destination-card";
        card.style.animationDelay = `${Math.min(index, 5) * 60}ms`;

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "card-image";

        const image = document.createElement("img");
        image.src = destination.image;
        image.alt = `${destination.name}, ${destination.country}`;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.style.visibility = "hidden";
            imageWrapper.style.background = "var(--surface-soft)";
        }, { once: true });

        const favoriteButton = document.createElement("button");
        favoriteButton.className = "favorite-button";
        favoriteButton.dataset.id = destination.id;

        const isFavorite = favorites.includes(destination.id);

        favoriteButton.classList.toggle("active", isFavorite);
        favoriteButton.textContent = isFavorite ? "♥" : "♡";
        favoriteButton.setAttribute("aria-pressed", String(isFavorite));
        favoriteButton.setAttribute(
            "aria-label",
            isFavorite ? "Remove from favorites" : "Add to favorites"
        );

        const categoryPill = document.createElement("span");
        categoryPill.className = "card-category-pill";
        categoryPill.textContent = destination.category;

        imageWrapper.append(image, favoriteButton, categoryPill);

        const content = document.createElement("div");
        content.className = "card-content";

        const location = document.createElement("span");
        location.className = "card-location";
        location.textContent = `↗ ${destination.country}`;

        const heading = document.createElement("h3");
        heading.textContent = destination.name;

        const description = document.createElement("p");
        description.textContent = destination.description;

        const bottom = document.createElement("div");
        bottom.className = "card-bottom";

        const rating = document.createElement("span");
        rating.className = "card-rating";
        rating.textContent = `★ ${destination.rating}`;

        bottom.appendChild(rating);

        const detailsButton = document.createElement("button");
        detailsButton.className = "details-button";
        detailsButton.dataset.id = destination.id;
        detailsButton.textContent = "Explore destination →";

        content.append(
            location,
            heading,
            description,
            bottom,
            detailsButton
        );

        card.append(imageWrapper, content);
        destinationGrid.appendChild(card);
    });
}


// ======================================
// 5. SEARCH + CATEGORY + FAVORITES
// ======================================

function applyFilters() {
    const searchText =
        searchInput.value.toLowerCase().trim();

    const filtered = destinations.filter(destination => {
        const matchesSearch = [
            destination.name,
            destination.country,
            destination.category,
            destination.description,
            ...destination.experiences
        ].some(value =>
            value.toLowerCase().includes(searchText)
        );

        const matchesCategory =
            selectedCategory === "All" ||
            destination.category === selectedCategory;

        const matchesFavorites =
            !favoritesOnly ||
            favorites.includes(destination.id);

        return matchesSearch &&
            matchesCategory &&
            matchesFavorites;
    });

    displayDestinations(filtered);
}

searchInput.addEventListener("input", applyFilters);

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        categoryButtons.forEach(item => {
            item.classList.toggle("active", item === button);
        });

        applyFilters();
    });
});

document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    selectedCategory = "All";
    favoritesOnly = false;

    categoryButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === "All"
        );
    });

    favoritesToggle.setAttribute("aria-pressed", "false");
    favoritesToggle.style.outline = "";

    applyFilters();
});


// ======================================
// 6. FAVORITES
// ======================================

function updateFavoriteCount() {
    favoriteCount.textContent = favorites.length;
}

function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(item => item !== id);
        showToast("Removed from favorites.");
    } else {
        favorites.push(id);
        showToast("Added to favorites ♥");
    }

    saveStorage("travelora-favorites", favorites);

    updateFavoriteCount();
    applyFilters();

    if (currentDestination?.id === id) {
        updateModalFavoriteButton();
    }
}

destinationGrid.addEventListener("click", event => {
    const favoriteButton = event.target.closest(".favorite-button");
    const detailsButton = event.target.closest(".details-button");

    if (favoriteButton) {
        toggleFavorite(Number(favoriteButton.dataset.id));
    }

    if (detailsButton) {
        openDetails(Number(detailsButton.dataset.id));
    }
});

favoritesToggle.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;

    favoritesToggle.setAttribute(
        "aria-pressed",
        String(favoritesOnly)
    );

    favoritesToggle.style.outline =
        favoritesOnly ? "2px solid var(--accent)" : "";

    document.getElementById("destinations").scrollIntoView({
        behavior: "smooth"
    });

    applyFilters();
});



const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalDescription = document.getElementById("modalDescription");
const modalRating = document.getElementById("modalRating");

function openDetails(id) {
    const destination =
        destinations.find(item => item.id === id);

    if (!destination) return;

    currentDestination = destination;

    modalTitle.textContent =
        `${destination.name}, ${destination.country}`;

    modalCategory.textContent =
        `${destination.category} · ${destination.country}`;

    modalDescription.textContent =
        destination.description;

    modalRating.textContent =
        `★ ${destination.rating} guest rating`;

    document.getElementById("modalBestTime").textContent =
        destination.bestTime;

    document.getElementById("modalTemperature").textContent =
        destination.temperature;

    document.getElementById("modalDuration").textContent =
        destination.duration;

    modalImage.src = destination.image;
    modalImage.alt = `${destination.name} travel view`;

    modalImage.onerror = () => {
        modalImage.alt = `Image unavailable for ${destination.name}`;
    };


    const galleryImages = [destination.image];

    const thumbnails =
        document.getElementById("galleryThumbnails");

    thumbnails.replaceChildren();

    galleryImages.forEach((src, index) => {
        const button = document.createElement("button");

        button.className = "gallery-thumb";
        button.classList.toggle("active", index === 0);
        button.setAttribute("aria-label", `View photo ${index + 1}`);

        const img = document.createElement("img");
        img.src = src;
        img.alt = `${destination.name} photo ${index + 1}`;

        button.appendChild(img);

        button.addEventListener("click", () => {
            modalImage.src = src;

            thumbnails.querySelectorAll(".gallery-thumb")
                .forEach(item => item.classList.remove("active"));

            button.classList.add("active");
        });

        thumbnails.appendChild(button);
    });

    const experiences =
        document.getElementById("modalExperiences");

    experiences.replaceChildren();

    destination.experiences.forEach(experience => {
        const chip = document.createElement("span");

        chip.className = "experience-chip";
        chip.textContent = experience;

        experiences.appendChild(chip);
    });

    updateModalFavoriteButton();
    openModal(detailsModal);
}

function updateModalFavoriteButton() {
    const button = document.getElementById("modalFavorite");

    if (!currentDestination) return;

    const isFavorite =
        favorites.includes(currentDestination.id);

    button.textContent = isFavorite
        ? "♥ Added to favorites"
        : "♡ Add to favorites";

    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
}

document.getElementById("modalFavorite").addEventListener("click", () => {
    if (currentDestination) {
        toggleFavorite(currentDestination.id);
    }
});



function openModal(modal) {
    previousFocus = document.activeElement;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeButton = modal.querySelector(".close-modal");
    closeButton?.focus();
}

function closeModal(modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    const anotherModalOpen =
        document.querySelector(".modal.show");

    if (!anotherModalOpen) {
        document.body.style.overflow = "";
        previousFocus?.focus();
    }
}

document.querySelectorAll("[data-close-modal]").forEach(element => {
    element.addEventListener("click", () => {
        const modal = element.closest(".modal");

        if (modal) closeModal(modal);
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const openModals =
            document.querySelectorAll(".modal.show");

        const lastModal = openModals[openModals.length - 1];

        if (lastModal) closeModal(lastModal);
    }
});




const tripDestination =
    document.getElementById("tripDestination");

const tripDate =
    document.getElementById("tripDate");

const returnDate =
    document.getElementById("returnDate");

const tripSuccess =
    document.getElementById("tripSuccess");

const successSummary =
    document.getElementById("successSummary");

function getFormPlan() {
    return {
        destinationId: currentDestination.id,
        departureDate: tripDate.value,
        returnDate: returnDate.value,
        travelers: Number(document.getElementById("travelerCount").value),
        hotelIncluded: document.getElementById("hotelIncluded").checked,
        hotelCategory: document.getElementById("hotelCategory").value,
        carIncluded: document.getElementById("carIncluded").checked,
        carCategory: document.getElementById("carCategory").value
    };
}

function renderEstimatePreview() {
    const preview = document.getElementById("estimatePreview");
    preview.replaceChildren();

    const estimate = calculatePlanCosts(getFormPlan());

    if (!estimate || estimate.nights < 1) {
        preview.textContent =
            "Choose a departure and return date to calculate your estimate.";
        return;
    }

    [
        ["Hotel", estimate.costs.hotel],
        ["Rental car", estimate.costs.car],
        ["Food", estimate.costs.food],
        ["Local transportation", estimate.costs.localTransport],
        ["Activities & sightseeing", estimate.costs.activities]
    ].forEach(([label, amount]) => {
        const row = document.createElement("div");
        row.className = "estimate-preview-row";

        const name = document.createElement("span");
        name.textContent = label;

        const value = document.createElement("strong");
        value.textContent = formatCurrency(amount);

        row.append(name, value);
        preview.appendChild(row);
    });

    const total = document.createElement("div");
    total.className = "estimate-preview-total";
    total.textContent =
        `Estimated total · ${formatCurrency(estimate.costs.total)} USD`;
    preview.appendChild(total);
}

function updateReturnDateMinimum() {
    if (!tripDate.value) return;

    const earliestReturn = addDaysToDate(tripDate.value, 1);
    returnDate.min = earliestReturn;

    if (returnDate.value && returnDate.value < earliestReturn) {
        returnDate.value = earliestReturn;
    }
}

function updateOptionalFields() {
    document.getElementById("hotelCategoryField").hidden =
        !document.getElementById("hotelIncluded").checked;
    document.getElementById("carCategoryField").hidden =
        !document.getElementById("carIncluded").checked;
    renderEstimatePreview();
}

function openPlanner(planToEdit = null) {
    if (planToEdit) {
        currentDestination = destinations.find(
            item => item.id === Number(planToEdit.destinationId)
        );
    }

    if (!currentDestination) return;

    editingPlanId = planToEdit ? String(planToEdit.id) : null;
    tripForm.hidden = false;
    tripSuccess.hidden = true;
    tripForm.reset();
    tripDestination.value =
        `${currentDestination.name}, ${currentDestination.country}`;

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
    tripDate.min = planToEdit?.departureDate || localToday;

    if (planToEdit) {
        document.getElementById("travelerName").value = planToEdit.name;
        tripDate.value = planToEdit.departureDate;
        returnDate.value = planToEdit.returnDate;
        document.getElementById("travelerCount").value =
            String(planToEdit.travelers);
        document.getElementById("hotelIncluded").checked =
            planToEdit.hotelIncluded;
        document.getElementById("hotelCategory").value =
            planToEdit.hotelCategory;
        document.getElementById("carIncluded").checked =
            planToEdit.carIncluded;
        document.getElementById("carCategory").value =
            planToEdit.carCategory;
        document.getElementById("tripNotes").value = planToEdit.notes;
    } else {
        tripDate.value = "";
        returnDate.value = "";
    }

    updateReturnDateMinimum();
    document.getElementById("submitPlanLabel").textContent =
        planToEdit ? "Save trip changes" : "Create my trip plan";
    updateOptionalFields();

    closeModal(detailsModal);
    closeModal(planDetailsModal);
    openModal(plannerModal);
}

document.getElementById("openPlanner").addEventListener("click", () => {
    openPlanner();
});

tripDate.addEventListener("change", () => {
    updateReturnDateMinimum();
    renderEstimatePreview();
});
returnDate.addEventListener("change", renderEstimatePreview);
document.getElementById("travelerCount")
    .addEventListener("change", renderEstimatePreview);
document.getElementById("hotelIncluded")
    .addEventListener("change", updateOptionalFields);
document.getElementById("hotelCategory")
    .addEventListener("change", renderEstimatePreview);
document.getElementById("carIncluded")
    .addEventListener("change", updateOptionalFields);
document.getElementById("carCategory")
    .addEventListener("change", renderEstimatePreview);

tripForm.addEventListener("submit", event => {
    event.preventDefault();

    const name =
        document.getElementById("travelerName").value.trim();
    const previousPlan = savedPlans.find(
        plan => String(plan.id) === editingPlanId
    );

    if (!name || !tripDestination.value || !tripDate.value ||
        !returnDate.value) {
        showToast("Please complete the required fields.");
        return;
    }

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    if (tripDate.value < today &&
        (!previousPlan || tripDate.value !== previousPlan.departureDate)) {
        showToast("Please choose today or a future departure date.");
        return;
    }

    if (getTripNights(tripDate.value, returnDate.value) < 1) {
        showToast("Return date must be after the departure date.");
        return;
    }

    const draft = getFormPlan();
    const estimate = calculatePlanCosts(draft);
    if (!estimate) {
        showToast("Could not calculate this trip. Please select a destination again.");
        return;
    }

    const plan = {
        id: previousPlan?.id ||
            `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        destinationId: currentDestination.id,
        destination: tripDestination.value,
        departureDate: tripDate.value,
        returnDate: returnDate.value,
        travelers: draft.travelers,
        hotelIncluded: draft.hotelIncluded,
        hotelCategory: draft.hotelCategory,
        carIncluded: draft.carIncluded,
        carCategory: draft.carCategory,
        notes: document.getElementById("tripNotes").value.trim(),
        costs: estimate.costs,
        reminderSent: previousPlan?.departureDate === tripDate.value
            ? Boolean(previousPlan.reminderSent)
            : false
    };

    const updatedPlans = previousPlan
        ? savedPlans.map(item =>
            String(item.id) === editingPlanId ? plan : item
        )
        : [...savedPlans, plan];

    if (!saveStorage("travelora-plans", updatedPlans)) return;

    savedPlans = updatedPlans;
    activePlanId = String(plan.id);
    editingPlanId = null;
    renderPlannedTrips();
    updateTripReminder();

    successSummary.textContent =
        `${name}, your ${estimate.days}-day trip to ${plan.destination} ` +
        `is saved. Estimated total: ${formatCurrency(estimate.costs.total)}.`;

    tripForm.hidden = true;
    tripSuccess.hidden = false;
});

function appendSummaryItem(container, label, value) {
    const item = document.createElement("div");
    item.className = "plan-summary-item";

    const name = document.createElement("span");
    name.textContent = label;

    const detail = document.createElement("strong");
    detail.textContent = value;

    item.append(name, detail);
    container.appendChild(item);
}

function showPlan(plan) {
    const destination = destinations.find(
        item => item.id === Number(plan.destinationId)
    );
    if (!destination) {
        showToast("This destination is no longer available.");
        return;
    }

    activePlanId = String(plan.id);
    document.getElementById("planDetailsImage").src = destination.image;
    document.getElementById("planDetailsImage").alt =
        `${destination.name}, ${destination.country}`;
    document.getElementById("planDetailsTitle").textContent =
        plan.destination;

    const nights = getTripNights(plan.departureDate, plan.returnDate);
    const daysUntil = getDaysUntilTrip(plan.departureDate);
    document.getElementById("planDetailsCountdown").textContent =
        daysUntil < 0
            ? "Departure date has passed"
            : daysUntil === 0
                ? "Departure is today"
                : `${daysUntil} ${daysUntil === 1 ? "day" : "days"} until departure`;

    const summary = document.getElementById("planSummaryGrid");
    summary.replaceChildren();
    const hotelLabels = {
        budget: "Comfortable budget",
        standard: "Mid-range",
        premium: "Premium"
    };
    const carLabels = {
        economy: "Economy",
        comfort: "Comfort",
        suv: "SUV"
    };
    [
        ["Traveler", plan.name],
        ["Departure", formatTripDate(plan.departureDate)],
        ["Return", formatTripDate(plan.returnDate)],
        ["Trip duration", `${nights + 1} days / ${nights} nights`],
        ["Travelers", String(plan.travelers)],
        ["Hotel booking", plan.hotelIncluded
            ? `${hotelLabels[plan.hotelCategory] || hotelLabels.standard} · ${formatCurrency(plan.costs.hotel)}`
            : "Not included"],
        ["Rental car", plan.carIncluded
            ? `${carLabels[plan.carCategory] || carLabels.comfort} · ${formatCurrency(plan.costs.car)}`
            : "Not included"],
        ["Food estimate", formatCurrency(plan.costs.food)],
        ["Local transportation", formatCurrency(plan.costs.localTransport)],
        ["Activities & sightseeing", formatCurrency(plan.costs.activities)]
    ].forEach(([label, value]) => appendSummaryItem(summary, label, value));

    if (plan.notes) {
        appendSummaryItem(summary, "Notes", plan.notes);
    }

    const breakdown = document.getElementById("planCostBreakdown");
    breakdown.replaceChildren();
    [
        ["Hotel", plan.costs.hotel],
        ["Rental car", plan.costs.car],
        ["Food", plan.costs.food],
        ["Local transportation", plan.costs.localTransport],
        ["Activities & sightseeing", plan.costs.activities]
    ].forEach(([label, amount]) => {
        const row = document.createElement("div");
        row.className = "cost-breakdown-row";

        const title = document.createElement("span");
        title.textContent = label;

        const value = document.createElement("strong");
        value.textContent = formatCurrency(amount);

        row.append(title, value);
        breakdown.appendChild(row);
    });

    document.getElementById("planEstimatedTotal").textContent =
        formatCurrency(plan.costs.total);
    openModal(planDetailsModal);
}

plannedTrips.addEventListener("click", event => {
    const button = event.target.closest("[data-trip-action]");
    if (!button) return;

    const plan = savedPlans.find(
        item => String(item.id) === button.dataset.tripId
    );
    if (!plan) return;

    if (button.dataset.tripAction === "show") {
        showPlan(plan);
    } else if (button.dataset.tripAction === "edit") {
        openPlanner(plan);
    } else if (button.dataset.tripAction === "delete") {
        const updatedPlans = savedPlans.filter(
            item => String(item.id) !== String(plan.id)
        );

        if (!saveStorage("travelora-plans", updatedPlans)) return;

        savedPlans = updatedPlans;
        renderPlannedTrips();
        updateTripReminder();
        showToast("Trip plan deleted.");
    }
});

document.getElementById("editDetailsPlan").addEventListener("click", () => {
    const plan = savedPlans.find(
        item => String(item.id) === activePlanId
    );

    if (plan) openPlanner(plan);
});

document.getElementById("showSavedPlan").addEventListener("click", () => {
    const plan = savedPlans.find(
        item => String(item.id) === activePlanId
    );

    if (!plan) {
        showToast("Could not find the saved trip plan.");
        return;
    }

    closeModal(plannerModal);
    showPlan(plan);
});

document.getElementById("closeSuccess").addEventListener("click", () => {
    closeModal(plannerModal);
    showToast("Your trip plan is saved.");
    document.getElementById("my-trips").scrollIntoView({
        behavior: "smooth"
    });
});




const savedTheme = readStorage("travelora-theme", "light");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

function updateThemeButton() {
    const isDark =
        document.body.classList.contains("dark-mode");

    themeToggle.textContent = isDark ? "☀" : "☾";

    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    themeToggle.title =
        isDark ? "Switch to light mode" : "Switch to dark mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const theme =
        document.body.classList.contains("dark-mode")
            ? "dark"
            : "light";

    saveStorage("travelora-theme", theme);

    updateThemeButton();
});



updateFavoriteCount();
updateThemeButton();
displayDestinations(destinations);
renderPlannedTrips();
updateTripReminder();

if (typeof Notification !== "undefined" &&
    Notification.permission === "granted") {
    enableReminders.textContent = "Browser reminders enabled";
}
