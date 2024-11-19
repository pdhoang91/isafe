// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Ví dụ: API để xác minh khuôn mặt
export const verifyFace = (file) => {
    const formData = new FormData();
    formData.append('image', file); // 'image' là key mà backend mong đợi

    const data = apiClient.post('/verify_face', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return data
};


// API để lấy danh sách cảnh báo
export const getAlerts = () => {
    return apiClient.get('/alerts');
};

// API để thêm người dùng mới
export const addUser = (userData) => {
    return apiClient.post('/add_user', userData);
};

// API để lấy danh sách người dùng
export const getUsers = () => {
    return apiClient.get('/users');
};

export const getUserSnapshots = (userId) => {
    return apiClient.get(`/users/${userId}/snapshots`);
};


export const getUserById = (id) => {
    return apiClient.get(`/users/${id}`);
};


// API để cập nhật thông tin người dùng
export const updateUser = (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
};

// API để xóa người dùng
export const deleteUser = (id) => {
    return apiClient.delete(`/users/${id}`);
};



// Thêm các API khác tùy thuộc vào backend của bạn
export default apiClient;
