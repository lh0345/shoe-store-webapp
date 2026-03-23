/* ServiceContainer.js - Dependency injection container for better OOP */
export class ServiceContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, service) {
    this.services.set(name, service);
    return this;
  }

  get(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }
    return service;
  }

  has(name) {
    return this.services.has(name);
  }

  // Get all services as an object for backward compatibility
  getAll() {
    const result = {};
    for (const [name, service] of this.services) {
      result[name] = service;
    }
    return result;
  }
}
