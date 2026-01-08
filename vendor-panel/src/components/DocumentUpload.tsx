import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadDocument } from '../services/upload.service';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
    label: string;
    type: string;
    onUploadComplete: (url: string) => void;
}

export default function DocumentUpload({ label, type, onUploadComplete }: DocumentUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        setFileName(file.name);

        try {
            const response = await uploadDocument(file, type);
            if (response.success) {
                setIsUploaded(true);
                onUploadComplete(response.data.fileUrl);
                toast.success(`${label} uploaded successfully`);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Failed to upload ${label}`);
            setFileName('');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isUploaded ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                <div className="space-y-1 text-center">
                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <Loader className="h-8 w-8 text-primary-600 animate-spin" />
                            <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                        </div>
                    ) : isUploaded ? (
                        <div className="flex flex-col items-center">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <p className="text-sm text-green-700 mt-2 font-medium">Uploaded</p>
                            <p className="text-xs text-green-600 truncate max-w-[200px]">{fileName}</p>
                            <button
                                type="button"
                                onClick={() => { setIsUploaded(false); setFileName(''); }}
                                className="text-xs text-red-500 mt-2 hover:underline"
                            >
                                Change File
                            </button>
                        </div>
                    ) : (
                        <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input
                                        type="file"
                                        className="sr-only"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
