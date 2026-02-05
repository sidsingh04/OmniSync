//Return the IndexDB instance
//Open once and reuse 

let dbInstance = null;

export function openDB() {

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject("IndexedDB not supported in this browser.");
      return;
    }

    const request = indexedDB.open("AgentMonitorDB", 1);

    request.onerror = () => {
      console.error("Database failed to open", request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log("Database opened successfully");

      dbInstance = db;   // cache the instance

      //reset if browser closes the connection
      db.onclose = () => {
        console.warn("IndexedDB connection closed");
        dbInstance = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log("Setting up database structure...");

      if (!db.objectStoreNames.contains("agents")) {
        const store = db.createObjectStore("agents", { keyPath: "agentId" });
        store.createIndex("status", "status", { unique: false });
      }

      if (!db.objectStoreNames.contains("Issues")) {
        const store = db.createObjectStore("Issues", { keyPath: "issueId" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("agentId", "agentId", { unique: false });
      }

      if (!db.objectStoreNames.contains("OfflineQueue")) {
        const store=db.createObjectStore("OfflineQueue", { keyPath: "id", autoIncrement: true });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("agentId", "agentId", { unique: false });
      }

      if (!db.objectStoreNames.contains("attachments")) {
        const store = db.createObjectStore("attachments", {
          keyPath: "issueId",
          autoIncrement: true
        });

        // store.createIndex("issueId", "issueId", { unique: false });
        store.createIndex("agentId", "agentId", { unique: false });
      }

      if (!db.objectStoreNames.contains("agentLogin")) {
        const store = db.createObjectStore("agentLogin", {
          keyPath: "agentId"
        });

      }

      if (!db.objectStoreNames.contains("supervisorLogin")) {
        const store = db.createObjectStore("supervisorLogin", {
          keyPath: "supervisorId"
        });
      }
    };
  });
}
