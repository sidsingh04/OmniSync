// Perform operations on offline queue

export async function addToOfflineQueue(db, payload) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not connected');
        }

        const transaction = db.transaction("OfflineQueue", "readwrite");
        const store = transaction.objectStore("OfflineQueue");

        const request = store.add(payload);

        request.onsuccess = function () {
            console.log("Event inserted successfully in queue:", payload);
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };

    })

}

export async function getOfflineQueue(db) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not connected');
        }

        const transaction = db.transaction("OfflineQueue", "readonly");
        const store = transaction.objectStore("OfflineQueue");

        const request = store.getAll();

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    })
}

export async function removeFromOfflineQueue(db, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject('DB not connected');
        }

        const transaction = db.transaction("OfflineQueue", "readwrite");
        const store = transaction.objectStore("OfflineQueue");

        const request = store.delete(id);

        request.onsuccess = function () {
            resolve("Successfully Deleted");
        };

        request.onerror = function () {
            reject(request.error);
        };
    })
}
