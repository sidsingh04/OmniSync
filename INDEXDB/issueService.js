//TICKET/ISSUE OPERATIONS ON INDEXDB

export function addIssues(db,obj){
    return new Promise((resolve,reject)=>{
        const transaction = db.transaction("Issues", "readwrite");
        const store = transaction.objectStore("Issues");
    
        const request = store.add(obj);
    
        request.onsuccess = () => {
          console.log("Issue added successfully");
          resolve(obj);
        };
    
        request.onerror = () => {
          console.error("Error adding issue:", request.error);
          reject(request.error);
        };    
    });
}

export function getAllIssues(db){
    return new Promise((resolve,reject)=>{
        const transaction = db.transaction("Issues", "readonly");
        const store = transaction.objectStore("Issues");
    
        const request = store.getAll();
    
        request.onsuccess = () => {
          resolve(request.result);   
        };
    
        request.onerror = () => {
          console.error("Error fetching issues:", request.error);
          reject(request.error);
        };
    });
}

export function getIssueByIssueId(db,id){
    return new Promise((resolve,reject)=>{
      const transaction = db.transaction("Issues", "readonly");
      const store = transaction.objectStore("Issues");
      // const index = store.index("status");

      const request = store.get(id);

      request.onsuccess = () => {
          resolve(request.result);   
      };

      request.onerror = () => {
          console.error("Error fetching issues by status:", request.error);
      reject(request.error);
      };
    })
}

export function getIssueByStatus(db,status){
    return new Promise((resolve,reject)=>{
        const transaction = db.transaction("Issues", "readonly");
        const store = transaction.objectStore("Issues");
        const index = store.index("status");

        const request = index.getAll(status);

        request.onsuccess = () => {
            resolve(request.result);   
        };

        request.onerror = () => {
            console.error("Error fetching issues by status:", request.error);
        reject(request.error);
        };

    });
}

export function getIssueByAgentId(db,id){
    return new Promise((resolve,reject)=>{
        const transaction = db.transaction("Issues", "readonly");
        const store = transaction.objectStore("Issues");
        const index = store.index("agentId");

        const request = index.getAll(id);

        request.onsuccess = () => {
            resolve(request.result);   
        };

        request.onerror = () => {
            console.error("Error fetching issues by status:", request.error);
        reject(request.error);
        };

    });
}

export function updateIssue(db, obj) {
    return new Promise((resolve, reject) => {
  
      const transaction = db.transaction("Issues", "readwrite");
      const store = transaction.objectStore("Issues");
  
      const request = store.put(obj);   
  
      request.onsuccess = () => {
        console.log("Issue updated successfully");
        resolve(obj);
      };
  
      request.onerror = () => {
        console.error("Error updating issue:", request.error);
        reject(request.error);
      };
  
    });
  }
  