'use client';

/**
 * Defines the context for a Firestore security rule violation.
 * This information is used to generate a detailed error message
 * that helps developers debug their security rules.
 */
export type SecurityRuleContext = {
  // The full path to the document or collection being accessed.
  path: string;
  // The type of operation that was denied.
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  // The data that was being sent to the server for write operations.
  requestResourceData?: any;
};

/**
 * A custom error class for Firestore permission errors.
 * It encapsulates the context of the security rule violation, allowing for
 * more detailed and actionable error messages during development.
 */
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions. The following request was denied by Firestore Security Rules:`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is necessary for custom errors in TypeScript.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
