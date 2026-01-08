import api from './api';

export const uploadDocument = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getMyDocuments = async () => {
    const response = await api.get('/documents');
    return response.data;
};
