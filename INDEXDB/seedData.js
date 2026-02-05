import { openDB } from "./IndexDB.js";

export async function seedSampleData() {
  const db = await openDB();

  const tx = db.transaction(["agents", "Issues", "agentLogin", "supervisorLogin"], "readwrite");
  const agentStore = tx.objectStore("agents");
  const issueStore = tx.objectStore("Issues");
  const agentLoginStore = tx.objectStore("agentLogin");
  const supervisorLoginStore = tx.objectStore("supervisorLogin");

  const sampleAgents = [
    { agentId: "A101", name: "Ravi", status: "Offline", callduration: 0, enrolledDate: Date.now(), totalPending: 0, totalResolved: 0 ,successfullCalls:0,failCalls:0,pendingApprovals:0},
    { agentId: "A102", name: "Priya", status: "Offline", callduration: 0, enrolledDate: Date.now(), totalPending: 0, totalResolved: 0 ,successfullCalls:0,failCalls:0,pendingApprovals:0},
    { agentId: "A103", name: "Arjun", status: "Offline", callduration: 0, enrolledDate: Date.now(), totalPending: 0, totalResolved: 0 ,successfullCalls:0,failCalls:0,pendingApprovals:0},
    { agentId: "A104", name: "Neha", status: "Offline", callduration: 0, enrolledDate: Date.now(), totalPending: 0, totalResolved: 0 ,successfullCalls:0,failCalls:0,pendingApprovals:0}
  ];

  const AgentCredentials = [
    { agentId: "A102", password: "hello" },
    { agentId: "A103", password: "hello" },
    { agentId: "A104", password: "hello" },
    { agentId: "A101", password: "hello" }
  ];

  const SupervisorCredentials = [
    { supervisorId: "S102", password: "hello" }
  ]

  // Insert agents
  for (const agent of sampleAgents) {
    agentStore.put(agent);   // put = insert or update safely
  }

  // // Insert issues
  // for (const issue of sampleIssues) {
  //   issueStore.put(issue);
  // }

  for (const agentcreds of AgentCredentials) {
    agentLoginStore.put(agentcreds);
  }

  for (const supcreds of SupervisorCredentials) {
    supervisorLoginStore.put(supcreds);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      console.log("Sample agents and issues inserted successfully");
      resolve();
    };

    tx.onerror = () => reject(tx.error);
  });
}

seedSampleData()
  .then(() => console.log("Seeding completed"))
  .catch(err => console.error("Seeding failed", err));