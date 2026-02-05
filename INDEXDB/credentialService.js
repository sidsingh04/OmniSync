//For login credentials of agent and supervisor

export function getAgentPassword(db,agentId){
    return new Promise((resolve,reject)=>{
        if (!db) {
            reject("DB not initialized");
            return;
        }

        const transaction = db.transaction("agentLogin", "readonly");
        const store = transaction.objectStore("agentLogin");

        const request = store.get(agentId);

        request.onsuccess = function () {
            if(!request.result)reject("Invalid-Credentials");
            resolve(request.result.password); 
        };

        request.onerror = function () {
            reject(request.error);
        };
    })   
}

export function getSupervisorPassword(db,supervisorId){
    return new Promise((resolve,reject)=>{
        if (!db) {
            reject("DB not initialized");
            return;
        }

        const transaction = db.transaction("supervisorLogin", "readonly");
        const store = transaction.objectStore("supervisorLogin");

        const request = store.get(supervisorId);

        request.onsuccess = function () {
            if(!request.result)reject("Invalid-Credentials");
            resolve(request.result.password); 
        };

        request.onerror = function () {
            reject(request.error);
        };
    })   
}