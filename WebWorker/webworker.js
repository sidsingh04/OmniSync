// Would use web-worker to handle calculation of agent-metrics
// For calculating agent's suceess rate for now can be extended later for other analytics

self.onmessage = function (e) {
    const { type, success, fail } = e.data;
    if (type == "successRate") {
        if (success + fail == 0) {
            self.postMessage({status:"success",successRate:'0%'});
            return;
        }
        const successRate = (success / (success + fail)) * 100;
        self.postMessage({status:"success",successRate:`${successRate.toFixed(2)}%`});
    }
};

self.onerror = function (e) {
    console.error("Web Worker Error:", e);
    self.postMessage({status:"error",message:"Web Worker Error"});
};
