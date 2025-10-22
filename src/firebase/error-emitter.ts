'use client';
import { EventEmitter } from 'events';

// This is a global event emitter for the entire application.
// It's used to decouple components and services, allowing them to communicate
// without direct dependencies.

// We specifically use it to broadcast Firestore permission errors from the data
// layer to a listener component in the UI layer. This is crucial for providing
// rich, contextual error messages to the developer during development.
export const errorEmitter = new EventEmitter();
