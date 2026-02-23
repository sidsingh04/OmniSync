//Maintaining an error set for seeing the types of error encountered
// import { getAllIssues } from "../INDEXDB/issueService.js";

export const errorTypeSet = new Set();

export function registerErrorType(errorType) {
    if (!errorType) return;

    const isNew = !errorTypeSet.has(errorType);

    errorTypeSet.add(errorType);

    if (isNew) {
        console.log("New error type detected:", errorType);
    }
}

export async function InitializeErrorSet() {
    let ErrorSet = 0;

    ErrorSet = await fetch('/api/ticket/get-all')
        .then(res => res.json())
        .then(data => data.tickets);

    errorTypeSet.clear();
    for (const err of ErrorSet) {
        errorTypeSet.add(err.code);
    }
    console.log("Error-codes initialized:", errorTypeSet);
}

export function clearErrorTypes() {
    errorTypeSet.clear();
}