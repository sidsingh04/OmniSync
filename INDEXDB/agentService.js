// AGENT OPERATIONS ON INDEXDB

export function createAgent(db,obj){
  return new Promise((resolve, reject) => {
    if (!db) {
        reject("DB not initialized");
        return;
    }

    const transaction = db.transaction("agents", "readwrite");
    const store = transaction.objectStore("agents");

    const request = store.add(obj);

    request.onsuccess = function () {
        console.log("Agent inserted successfully:", obj);
        resolve(request.result); 
    };

    request.onerror = function () {
        reject(request.error);
    };
});
}


export function getAllAgents(db){
    return new Promise((resolve,reject)=>{
      if(!db){
        reject("DB not initialized");
        return;
      }
  
      const transaction = db.transaction("agents", "readonly");
      const store = transaction.objectStore("agents");
  
      const request = store.getAll();
  
      request.onsuccess = function () {
          const agents = request.result;
          resolve(agents);
      };
  
      request.onerror = function () {
          reject(request.error);
      };
    })
}

export function getAgentsOfStatus(db,status){
  return new Promise((resolve, reject) => {
      if(!db) {
        reject("DB not initialized");
        return;
      }

      const transaction = db.transaction("agents", "readonly");
      const store = transaction.objectStore("agents");

      const index = store.index("status");

      const request = index.getAll(status);   // filter here

      request.onsuccess = function () {
          resolve(request.result);   // array of matching agents
      };

      request.onerror = function () {
          reject(request.error);
      };
  });
}

export function getAgentById(db,id){
  return new Promise((resolve, reject) => {
    if (!db) {
        reject("Database not initialized");
        return;
    }

    const transaction = db.transaction("agents", "readonly");
    const store = transaction.objectStore("agents");

    const request = store.get(id);   

    request.onsuccess = function () {
        resolve(request.result);   
    };

    request.onerror = function () {
        reject(request.error);
    };
  });
}

//To maintain the changing state of the user
//Uses put method and replaces complete object
export function UpdateAgent(db,updatedAgent){
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("DB not initialized");
            return;
        }

        if (!updatedAgent || !updatedAgent.agentId) {
            reject("Invalid agent object: missing agentId primary key");
            return;
        }

        const transaction = db.transaction("agents", "readwrite");
        const store = transaction.objectStore("agents");

        const request = store.put(updatedAgent); // replaces by primary key

        request.onerror = () => {
            console.error("Put failed:", request.error);
            reject(request.error);
          };

        transaction.oncomplete = () => {
            resolve("Agent updated successfully");
          };
      
          transaction.onerror = () => {
            reject(transaction.error);
          };
      
          transaction.onabort = () => {
            reject("Transaction aborted");
          };
    });
}

export function deleteAgent(db,id){
  return new Promise((resolve, reject) => {
    if (!db) {
        reject("Database not initialized");
        return;
    }

    const transaction = db.transaction("agents", "readwrite");
    const store = transaction.objectStore("agents");

    const request = store.delete(id); 

    request.onsuccess = function () {
        resolve("Successfully Deleted");   
    };

    request.onerror = function () {
        reject(request.error);
    };
});
}

