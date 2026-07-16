import apiClient from './client';

export const superAdminApi = {
  getAdmins: () => apiClient.get('/SuperAdmin/admins'),
  getPendingAdmins: () => apiClient.get('/SuperAdmin/admins/pending'),
  getStats: () => apiClient.get('/SuperAdmin/stats'),
  getEmployeePrice: () => apiClient.get('/SuperAdmin/config/employee_price_inr'),
  
  approveAdmin: (empId) => apiClient.patch(`/SuperAdmin/admins/${empId}/approve`),
  revokeAdmin: (empId, data) => apiClient.patch(`/SuperAdmin/admins/${empId}/revoke`, data),
  updateAdminStatus: (empId, data) => apiClient.patch(`/SuperAdmin/admins/${empId}/status`, data),
  toggleAccess: (empId, data) => apiClient.patch(`/SuperAdmin/admins/${empId}/toggle-status`, data),
  updateSpaceLimits: (spaceId, data) => apiClient.patch(`/SuperAdmin/spaces/${spaceId}/limits`, data),
  
  saveEmployeePrice: (data) => apiClient.patch('/SuperAdmin/config/employee_price_inr', data),
  updateProfile: (data) => apiClient.patch('/SuperAdmin/profile', data),
  createSuperAdmin: (data) => apiClient.post('/SuperAdmin/create-superadmin', data),
  registerCompany: (data) => apiClient.post('/Auth/register', data)
};
