/*
Here the image/audio would be uploaded to the server by agent, when he sends 
for approval
*/

import { openDB } from "../INDEXDB/IndexDB.js";

let attachmentBlob = null;

//Currently just store the image in BLOB and store it in INDEXDB store 

// Initializes input + preview 
export function initMultipartUpload(fileInputId, previewContainerId) {
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewContainerId);

    if (!fileInput || !preview) {
        console.warn("Multipart upload init failed: DOM elements missing");
        return;
    }

    fileInput.addEventListener("change", () => {
        preview.innerHTML = "";
        attachmentBlob = fileInput.files[0];
        preview.style.display = 'flex'; 

        if (!attachmentBlob) {
            preview.style.display = 'none';
            const label = fileInput.parentElement.querySelector('span');
            if (label) label.textContent = "Click to upload file";
            return;
        }

        // Update label with filename
        const label = fileInput.parentElement.querySelector('span');
        if (label) label.textContent = attachmentBlob.name;

        const url = URL.createObjectURL(attachmentBlob);

        if (attachmentBlob.type.startsWith("image/")) {
            const img = document.createElement("img");
            img.src = url;
            img.style.maxWidth = "200px";
            preview.appendChild(img);
        }

        if (attachmentBlob.type.startsWith("audio/")) {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.src = url;
            preview.appendChild(audio);
        }
    });
}


// Saves attachment blob to IndexedDB
export async function saveAttachment(issueId, agentId) {
    if (!attachmentBlob) return;

    const db = await openDB();
    const tx = db.transaction("attachments", "readwrite");
    const store = tx.objectStore("attachments");

    store.put({
        issueId,
        agentId,
        blob: attachmentBlob,
        fileName: attachmentBlob.name,
        fileType: attachmentBlob.type,
        size: attachmentBlob.size,
        createdAt: new Date().toUTCString()
    });

    return tx.complete;
}


export function resetAttachment(previewContainerId) {
    attachmentBlob = null;
    const preview = document.getElementById(previewContainerId);
    if (preview) preview.innerHTML = "";
}