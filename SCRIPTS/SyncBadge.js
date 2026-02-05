const syncState = {
    status: "syncing",
    lastSyncTime: null
};

export function updateSyncState(document, status) {
    const badge = document.getElementById("syncbadge");
    if (!badge) return;

    if (status === "syncing") {
        badge.textContent = "Syncing…";
        badge.className = "sync-badge syncing";
    }

    if (status === "synced") {
        badge.textContent = "Live";
        badge.className = "sync-badge synced";
    }

    if (status === "offline") {
        badge.textContent = "Offline";
        badge.className = "sync-badge offline";
    }
}