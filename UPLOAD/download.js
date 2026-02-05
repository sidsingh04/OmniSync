/*
Here the image/audio would be shown when supervisor sees the approval request.
view button in approval-window
*/

import { openDB } from "../INDEXDB/IndexDB.js";

export async function getAttachment(issueId) {
    const db = await openDB();
    const tx = db.transaction("attachments", "readonly");
    const store = tx.objectStore("attachments");

    return new Promise((resolve, reject) => {
        const request = store.get(issueId);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error("Error fetching attachment:", request.error);
            reject(request.error);
        };
    });
}
