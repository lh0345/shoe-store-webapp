/* User.js - User authentication and authorization model */
export class User {
  constructor({
    id,
    username,
    email,
    password,
    role = 'admin',
    createdAt = new Date().toISOString(),
  }) {
    this.id = id;
    this.username = username;
    this.email = email || username; // Fallback to username if no email provided
    this.password = password; // In production, this should be hashed
    this.role = role;
    this.createdAt = createdAt;
  }

  hasPermission(permission) {
    const permissions = {
      admin: ['create', 'read', 'update', 'delete', 'manage_users'],
      editor: ['create', 'read', 'update'],
      viewer: ['read'],
    };
    return permissions[this.role]?.includes(permission) || false;
  }

  canManageProducts() {
    return (
      this.hasPermission('create') && this.hasPermission('update') && this.hasPermission('delete')
    );
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      password: this.password, // Include password for authentication
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}
